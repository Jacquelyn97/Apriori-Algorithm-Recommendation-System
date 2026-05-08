// pages/profile/profile.js
Page({
  goOrder() {
    wx.switchTab({ url: '/pages/order/order' });
  },
  goAddress() {
    wx.navigateTo({ url: '/pages/address-list/address-list' });
  },
  goCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
  }
});
