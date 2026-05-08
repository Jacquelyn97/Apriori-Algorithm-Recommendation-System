// pages/order-detail/order-detail.js
const app = getApp();
const { getItemImagePath, items: MENU_ITEMS } = require('../../utils/menuData.js');
const { getOrders } = require('../../utils/api.js');

const STATUS_BG = { '待支付': '#ff9500', '待取餐': '#4facfe', '已完成': '#07c160' };

function formatOrderTimeFull(dateStr) {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    return `${y}.${m}.${day} ${h}:${min}:${sec}`;
  } catch (_) {
    return dateStr || '';
  }
}

function imageKeyByName(name) {
  if (!name) return null;
  const base = name.includes('（') ? name.split('（')[0].trim() : name;
  const found = (MENU_ITEMS || []).find((x) => x.name === base);
  return found ? found.image : null;
}

Page({
  data: {
    statusBarHeight: 0,
    order: null,
    statusBg: '#ff9500',
    createTimeText: '',
    paidTimeText: '',
    totalQty: 0,
    items: [],
    paymentAmount: '0.00',
    isPendingPay: false
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const statusBarHeight = (sys.statusBarHeight || 0) + 6;
    const id = options.id;
    wx.showLoading({ title: '加载中...' });
    getOrders()
      .then((res) => {
        wx.hideLoading();
        const list = (res && res.ok && res.orders) ? res.orders : [];
        const order = list.find((o) => o.id === id);
        if (!order) {
          this.setData({ statusBarHeight, order: null });
          return;
        }
        const withImg = (order.items || []).map((it) => ({ ...it, image: it.image || imageKeyByName(it.name) }));
        const totalQty = order.totalQty || withImg.reduce((s, x) => s + (x.qty || 0), 0);
        const items = withImg.map((it) => ({
          ...it,
          imagePath: getItemImagePath(it.image),
          lineTotal: (Number(it.price || 0) * Number(it.qty || 1)).toFixed(2)
        }));
        const statusText = order.status || '待支付';
        const createTimeText = formatOrderTimeFull(order.createTime);
        const isPendingPay = statusText === '待支付';
        const paidTimeText = isPendingPay ? '--:--:--' : createTimeText;
        this.setData({
          statusBarHeight,
          order,
          statusBg: STATUS_BG[statusText] || '#ff9500',
          createTimeText,
          paidTimeText,
          totalQty,
          items,
          paymentAmount: Number(order.totalPrice || 0).toFixed(2),
          isPendingPay
        });
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ statusBarHeight, order: null });
      });
  },
  goBack() {
    wx.navigateBack();
  },
  goPay() {
    const order = this.data.order;
    if (!order) return;

    const items = (order.items || []).map((it) => ({
      id: it.id,
      name: it.name,
      price: Number(it.price || 0),
      image: it.image || null,
      qty: Number(it.qty || 0)
    }));

    // 重新带回确认订单页
    if (app.setCart) app.setCart(items);
    if (app.setDeliveryMode) app.setDeliveryMode(order.deliveryMode || 'self');
    if (order.deliveryMode !== 'delivery' && order.store && order.store.id && app.setPickupStoreId) {
      app.setPickupStoreId(order.store.id);
    }

    wx.navigateTo({ url: '/pages/checkout/checkout?repayOrderNo=' + encodeURIComponent(order.id) });
  }
});
