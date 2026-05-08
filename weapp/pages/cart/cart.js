// pages/cart/cart.js
const app = getApp();
const { getItemImagePath } = require('../../utils/menuData.js');

Page({
  data: {
    statusBarHeight: 0,
    cart: [],
    totalQty: 0,
    totalPrice: '0.00'
  },
  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: (sys.statusBarHeight || 0) + 6 });
  },
  onShow() {
    this.syncCart();
  },
  syncCart() {
    const cart = (app.getCart() || []).map((it) => ({
      ...it,
      imagePath: getItemImagePath(it.image),
      priceFixed: Number(it.price).toFixed(2),
      subTotal: (Number(it.price) * Number(it.qty || 1)).toFixed(2)
    }));
    const totalQty = app.getTotalQty();
    const totalPrice = app.getTotalPrice().toFixed(2);
    this.setData({ cart, totalQty, totalPrice });
  },
  clear() {
    if (this.data.cart.length === 0) return;
    app.clearCart();
    this.syncCart();
  },
  inc(e) {
    const i = e.currentTarget.dataset.index;
    const it = this.data.cart[i];
    if (!it) return;
    app.addToCart(it, 1);
    this.syncCart();
  },
  dec(e) {
    const i = e.currentTarget.dataset.index;
    const it = this.data.cart[i];
    if (!it) return;
    app.addToCart(it, -1);
    this.syncCart();
  },
  remove(e) {
    app.removeFromCart(e.currentTarget.dataset.id);
    this.syncCart();
  },
  goCheckout() {
    if (this.data.totalQty === 0) return;
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  },
  goBack() {
    wx.navigateBack();
  }
});
