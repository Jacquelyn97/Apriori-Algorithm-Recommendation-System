// pages/address-list/address-list.js
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    fromCheckout: false,
    addresses: [],
    selectedId: null,
    manageMode: false,
    selectedIds: []
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const statusBarHeight = (sys.statusBarHeight || 0) + 6;
    const fromCheckout = options.from === 'checkout';
    const addresses = app.getAddresses() || [];
    const selectedId = app.getSelectedAddressId();
    this.setData({ statusBarHeight, fromCheckout, addresses, selectedId });
  },
  onShow() {
    this.setData({ addresses: app.getAddresses() || [], selectedId: app.getSelectedAddressId() });
  },
  goBack() {
    wx.navigateBack();
  },
  onSelect(e) {
    const addr = e.currentTarget.dataset.addr;
    if (!addr) return;
    app.setSelectedAddressId(addr.id);
    app.setAddress({
      name: addr.name,
      phone: addr.phone,
      detail: [addr.region, addr.street].filter(Boolean).join(' ')
    });
    if (this.data.fromCheckout) wx.navigateBack();
    else this.setData({ selectedId: addr.id });
  },
  toggleManage() {
    this.setData({ manageMode: !this.data.manageMode, selectedIds: [] });
  },
  exitManage() {
    this.setData({ manageMode: false, selectedIds: [] });
  },
  addAddress() {
    wx.navigateTo({ url: '/pages/address-form/address-form' });
  },
  editAddress(e) {
    const id = e.currentTarget.dataset.id;
    const a = (this.data.addresses || []).find((x) => x.id === id);
    if (!a) return;
    wx.navigateTo({
      url: `/pages/address-form/address-form?id=${a.id}&region=${encodeURIComponent(a.region || '')}&street=${encodeURIComponent(a.street || '')}&name=${encodeURIComponent(a.name || '')}&phone=${encodeURIComponent(a.phone || '')}&isDefault=${a.isDefault ? 1 : 0}`
    });
  },
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    let selectedIds = this.data.selectedIds.slice();
    const idx = selectedIds.indexOf(id);
    if (idx >= 0) selectedIds.splice(idx, 1);
    else selectedIds.push(id);
    this.setData({ selectedIds });
  },
  selectAll() {
    const { addresses, selectedIds } = this.data;
    if (selectedIds.length >= addresses.length)
      this.setData({ selectedIds: [] });
    else
      this.setData({ selectedIds: addresses.map((a) => a.id) });
  },
  deleteOne(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该地址吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          app.removeAddress(id);
          this.setData({ addresses: app.getAddresses() || [], selectedIds: this.data.selectedIds.filter((x) => x !== id) });
        }
      }
    });
  },
  bulkDelete() {
    const { selectedIds } = this.data;
    if (selectedIds.length === 0) return;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除所选地址吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          app.removeAddresses(selectedIds);
          this.setData({ addresses: app.getAddresses() || [], manageMode: false, selectedIds: [] });
        }
      }
    });
  },
  setDefault(e) {
    const id = e.currentTarget.dataset.id;
    app.setAddressDefault(id);
    this.setData({ addresses: app.getAddresses() || [] });
  }
});
