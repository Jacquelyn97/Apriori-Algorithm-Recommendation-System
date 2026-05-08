const BASE_URL = 'http://127.0.0.1:5000'; // 本地开发：按你的 Flask 端口调整

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: method || 'GET',
      data: data || {},
      header: { 'Content-Type': 'application/json' },
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
}

function createOrder(payload) {
  return request('/api/order', 'POST', payload);
}

function payOrder(payload) {
  return request('/api/order/pay', 'POST', payload);
}

function getOrders() {
  return request('/api/orders', 'GET');
}

function confirmOrder(payload) {
  return request('/api/order/confirm', 'POST', payload);
}

module.exports = { request, createOrder, payOrder, getOrders, confirmOrder };

