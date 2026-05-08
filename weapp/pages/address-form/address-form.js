// pages/address-form/address-form.js
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    isEdit: false,
    id: '',
    region: '',
    street: '',
    name: '',
    phone: '',
    isDefault: false
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const statusBarHeight = (sys.statusBarHeight || 0) + 6;
    const isEdit = options.id != null && options.id !== '';
    this.setData({
      statusBarHeight,
      isEdit,
      id: options.id || '',
      region: decodeURIComponent(options.region || ''),
      street: decodeURIComponent(options.street || ''),
      name: decodeURIComponent(options.name || ''),
      phone: decodeURIComponent(options.phone || ''),
      isDefault: options.isDefault === '1' || options.isDefault === 1
    });
  },
  onRegionInput(e) {
    this.setData({ region: e.detail.value });
  },
  onStreetInput(e) {
    this.setData({ street: e.detail.value });
  },
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },
  onDefaultChange(e) {
    this.setData({ isDefault: e.detail.value });
  },
  save() {
    const { id, region, street, name, phone, isDefault, isEdit } = this.data;
    const r = (region || '').trim();
    const s = (street || '').trim();
    const n = (name || '').trim();
    const p = (phone || '').trim();
    if (!n || !p) {
      wx.showToast({ title: '请填写收货人和手机号', icon: 'none' });
      return;
    }
    if (isEdit) {
      app.updateAddress(id, { region: r, street: s, name: n, phone: p, isDefault });
    } else {
      app.addAddress({ region: r, street: s, name: n, phone: p, isDefault });
    }
    wx.navigateBack();
  },
  goBack() {
    wx.navigateBack();
  }
});
