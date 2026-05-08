// pages/index/index.js
const app = getApp();

Page({
  goSelf() {
    app.setDeliveryMode('self');
    wx.setStorageSync('deliveryMode', 'self');
    wx.switchTab({ url: '/pages/drink-menu/drink-menu' });
  },
  goDelivery() {
    app.setDeliveryMode('delivery');
    wx.setStorageSync('deliveryMode', 'delivery');
    wx.switchTab({ url: '/pages/drink-menu/drink-menu' });
  },
  goProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${id}` });
  }
});
