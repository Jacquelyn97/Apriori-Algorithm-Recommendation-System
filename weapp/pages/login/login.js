// pages/login/login.js
const app = getApp();

Page({
  onLogin() {
    app.globalData.loggedIn = true;
    wx.switchTab({ url: '/pages/index/index' });
  }
});
