// pages/checkout/checkout.js
const app = getApp();
const { getItemImagePath } = require('../../utils/menuData.js');
const { createOrder, payOrder } = require('../../utils/api.js');

const STORES = [
  {
    id: 'kuchai',
    name: 'Tea Stories (Kuchai)',
    address: 'Jalan Kuchai Maju 9, Kuchai Entrepreneurs Park',
    lat: 3.088849,
    lng: 101.686589
  },
  {
    id: 'sri-petaling',
    name: 'Tea Stories (Sri Petaling)',
    address: 'Jalan Radin Bagus, Bandar Baru Sri Petaling',
    lat: 3.201633,
    lng: 101.624323
  },
  {
    id: 'cheras',
    name: 'Tea Stories (Cheras)',
    address: 'Jalan Dataran Cheras 3, Dataran Perniagaan Cheras',
    lat: 3.03592,
    lng: 101.765402
  }
];

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '-- km';
  if (km < 0.1) return '<0.1 km';
  return `${km.toFixed(1)} km`;
}

function normalizeLatLng(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(o)) return { lat: null, lng: null, swapped: false };
  if (Math.abs(a) > 90 && Math.abs(o) <= 90) return { lat: o, lng: a, swapped: true };
  return { lat: a, lng: o, swapped: false };
}

Page({
  data: {
    deliveryMode: 'self',
    cart: [],
    totalQty: 0,
    totalPrice: '0.00',
    addressOk: false,
    selectedAddress: null,
    selectedStoreId: null,
    selectedStore: null,
    stores: STORES.map((s) => ({ ...s, distanceText: '...' })),
    paymentMethod: 'tng',
    // 若从“待支付订单”进入结算页，这里带上原订单号，用于支付时更新同一笔订单
    repayOrderNo: '',
    error: ''
  },
  refreshStoreDistances(selectedStoreId) {
    const baseStores = STORES.map((s) => ({ ...s }));
    const applyStores = (lat, lng) => {
      const list =
        lat == null || lng == null
          ? baseStores.map((s) => ({ ...s, distanceText: '-- km' }))
          : baseStores.map((s) => {
              const d = haversine(lat, lng, s.lat, s.lng);
              return { ...s, distanceKm: d, distanceText: formatDistance(d) };
            });
      const pickedId = selectedStoreId || baseStores[0].id;
      const selectedStore = list.find((s) => s.id === pickedId) || list[0] || null;
      this.setData({ stores: list, selectedStore });
    };

    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3000,
      success: (res) => {
        const n = normalizeLatLng(res.latitude, res.longitude);
        applyStores(n.lat, n.lng);
      },
      fail: () => applyStores(null, null)
    });
  },
  onLoad(options) {
    const repayOrderNo = options && options.repayOrderNo ? String(options.repayOrderNo) : '';
    const deliveryMode = app.getDeliveryMode() || 'self';
    const selectedAddress = app.getSelectedAddress();
    const addressOk = !!(
      selectedAddress &&
      selectedAddress.name &&
      selectedAddress.phone &&
      (selectedAddress.region || selectedAddress.street)
    );
    const cart = (app.getCart() || []).map((it) => ({
      ...it,
      imagePath: getItemImagePath(it.image),
      priceFixed: Number(it.price).toFixed(2),
      lineTotal: (Number(it.price) * Number(it.qty || 1)).toFixed(2)
    }));
    const totalQty = app.getTotalQty();
    const totalPrice = app.getTotalPrice().toFixed(2);
    const pickupStoreId = app.getPickupStoreId ? app.getPickupStoreId() : null;
    const selectedStoreId = pickupStoreId || this.data.selectedStoreId || STORES[0].id;
    const selectedStore = (this.data.stores || []).find((s) => s.id === selectedStoreId) || STORES[0] || null;
    if (app.setPickupStoreId) app.setPickupStoreId(selectedStoreId);
    this.setData({
      deliveryMode,
      cart,
      totalQty,
      totalPrice,
      selectedAddress,
      addressOk,
      selectedStoreId,
      selectedStore,
      repayOrderNo
    });
    this.refreshStoreDistances(selectedStoreId);
  },
  onShow() {
    const selectedAddress = app.getSelectedAddress();
    const addressOk = !!(
      selectedAddress &&
      selectedAddress.name &&
      selectedAddress.phone &&
      (selectedAddress.region || selectedAddress.street)
    );
    const cart = (app.getCart() || []).map((it) => ({
      ...it,
      imagePath: getItemImagePath(it.image),
      priceFixed: Number(it.price).toFixed(2),
      lineTotal: (Number(it.price) * Number(it.qty || 1)).toFixed(2)
    }));
    const pickupStoreId = app.getPickupStoreId ? app.getPickupStoreId() : this.data.selectedStoreId;
    const selectedStoreId = pickupStoreId || this.data.selectedStoreId || STORES[0].id;
    const selectedStore = (this.data.stores || []).find((s) => s.id === selectedStoreId) || STORES[0] || null;
    this.setData({
      selectedAddress,
      addressOk,
      cart,
      totalQty: app.getTotalQty(),
      totalPrice: app.getTotalPrice().toFixed(2),
      selectedStoreId,
      selectedStore
    });
    this.refreshStoreDistances(selectedStoreId);
  },
  goBack() {
    wx.navigateBack();
  },
  setDeliveryMode(e) {
    const mode = e.currentTarget.dataset.mode;
    app.setDeliveryMode(mode);
    this.setData({ deliveryMode: mode });
  },
  goAddressList() {
    wx.navigateTo({ url: '/pages/address-list/address-list?from=checkout' });
  },
  goStoreList() {
    if (app.setPickupStoreId) {
      const currentId = this.data.selectedStoreId || STORES[0].id;
      app.setPickupStoreId(currentId);
    }
    wx.navigateTo({ url: '/pages/store-list/store-list' });
  },
  // selectStore is handled in store-list page via global pickupStoreId
  setPayment(e) {
    this.setData({ paymentMethod: e.currentTarget.dataset.method });
  },
  submit() {
    const { deliveryMode, totalQty, selectedAddress, selectedStoreId, cart } = this.data;
    if (totalQty === 0) {
      this.setData({ error: '购物车为空' });
      return;
    }
    if (deliveryMode === 'delivery' && !this.data.addressOk) {
      this.setData({ error: '请先选择收货地址' });
      wx.showModal({
        title: '提示',
        content: '请选择您的收货地址',
        confirmText: '去选择',
        success: (res) => { if (res.confirm) this.goAddressList(); }
      });
      return;
    }
    if (deliveryMode !== 'delivery' && !selectedStoreId) {
      this.setData({ error: '请选择自取门店' });
      return;
    }
    const address =
      deliveryMode === 'delivery' && selectedAddress
        ? {
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            detail: [selectedAddress.region, selectedAddress.street].filter(Boolean).join(' ')
          }
        : null;
    const store = deliveryMode !== 'delivery' ? (this.data.stores || []).find((s) => s.id === selectedStoreId) : null;
    const items = cart.map((x) => ({
      id: x.id,
      name: x.name,
      price: x.price,
      qty: x.qty || 1,
      image: x.image || null,
      options: (x.name && x.name.match(/（([^）]+)）/)) ? x.name.match(/（([^）]+)）/)[1] : ''
    }));
    const repayOrderNo = (this.data.repayOrderNo || '').trim();
    wx.showLoading({ title: repayOrderNo ? '支付中...' : '下单中...' });

    const req = repayOrderNo
      ? payOrder({ order_no: repayOrderNo, paymentMethod: this.data.paymentMethod || 'tng' })
      : createOrder({
          deliveryMode,
          storeId: selectedStoreId,
          address,
          items,
          paymentMethod: this.data.paymentMethod || 'tng',
          status: '待取餐'
        });

    req
      .then((res) => {
        wx.hideLoading();
        if (!res || !res.ok) {
          this.setData({ error: (res && res.error) ? res.error : '下单失败' });
          return;
        }
        const oid = repayOrderNo || res.order_no;
        // 本地订单展示：用同一个 order_no（支付不会换单号）
        app.createOrder({
          id: oid,
          deliveryMode,
          address,
          store,
          items,
          totalQty,
          totalPrice: app.getTotalPrice(),
          status: '待取餐'
        });
        app.clearCart();
        wx.switchTab({ url: '/pages/order/order' });
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ error: '网络错误，下单失败' });
      });
  },
  payLater() {
    const { deliveryMode, totalQty, selectedAddress, selectedStoreId, cart } = this.data;
    if (totalQty === 0) {
      this.setData({ error: '购物车为空' });
      return;
    }
    if (deliveryMode === 'delivery' && !this.data.addressOk) {
      this.setData({ error: '请先选择收货地址' });
      wx.showModal({
        title: '提示',
        content: '请选择您的收货地址',
        confirmText: '去选择',
        success: (res) => { if (res.confirm) this.goAddressList(); }
      });
      return;
    }
    if (deliveryMode !== 'delivery' && !selectedStoreId) {
      this.setData({ error: '请选择自取门店' });
      return;
    }
    const address =
      deliveryMode === 'delivery' && selectedAddress
        ? {
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            detail: [selectedAddress.region, selectedAddress.street].filter(Boolean).join(' ')
          }
        : null;
    const store = deliveryMode !== 'delivery' ? (this.data.stores || []).find((s) => s.id === selectedStoreId) : null;
    const items = cart.map((x) => ({
      id: x.id,
      name: x.name,
      price: x.price,
      qty: x.qty || 1,
      image: x.image || null,
      options: (x.name && x.name.match(/（([^）]+)）/)) ? x.name.match(/（([^）]+)）/)[1] : ''
    }));
    wx.showLoading({ title: '提交中...' });
    createOrder({
      deliveryMode,
      storeId: selectedStoreId,
      address,
      items,
      paymentMethod: this.data.paymentMethod || 'tng',
      status: '待支付'
    })
      .then((res) => {
        wx.hideLoading();
        if (!res || !res.ok) {
          this.setData({ error: (res && res.error) ? res.error : '提交失败' });
          return;
        }
        app.createOrder({
          id: res.order_no,
          deliveryMode,
          address,
          store,
          items,
          totalQty,
          totalPrice: app.getTotalPrice(),
          status: '待支付'
        });
        app.clearCart();
        wx.navigateBack();
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ error: '网络错误，提交失败' });
      });
  }
});
