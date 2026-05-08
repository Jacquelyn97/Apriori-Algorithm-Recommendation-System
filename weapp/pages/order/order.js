// pages/order/order.js
const app = getApp();
const { getItemImagePath, items: MENU_ITEMS } = require('../../utils/menuData.js');
const { getOrders, confirmOrder } = require('../../utils/api.js');

const TABS = [{ key: 'all', label: '全部' }, { key: 'pending_pay', label: '待支付' }, { key: 'pending_pick', label: '待取餐' }, { key: 'done', label: '完成' }];
const STATUS_COLOR = { '待支付': '#ff9500', '待取餐': '#4facfe', '已完成': '#07c160' };

function formatOrderTime(dateStr) {
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

function itemBaseName(item) {
  if (!item || !item.name) return '商品';
  return item.name.includes('（') ? item.name.split('（')[0].trim() : item.name;
}

function itemOptions(item) {
  if (!item) return '';
  if (item.options) return item.options;
  const match = item.name && item.name.match(/（([^）]+)）/);
  return match ? match[1] : '';
}

function imageKeyByName(name) {
  if (!name) return null;
  const base = name.includes('（') ? name.split('（')[0].trim() : name;
  const found = (MENU_ITEMS || []).find((x) => x.name === base);
  return found ? found.image : null;
}

Page({
  data: {
    activeTab: 'all',
    filteredOrders: [],
    expandedMap: {},
    emptyHint: '暂无订单历史',
    orders: []
  },
  onShow() {
    this.loadFromDb();
  },
  loadFromDb() {
    wx.showLoading({ title: '加载中...' });
    getOrders()
      .then((res) => {
        wx.hideLoading();
        const list = (res && res.ok && res.orders) ? res.orders : [];
        // 补上图片 key，复用原有 getItemImagePath 显示
        const orders = list.map((o) => ({
          ...o,
          items: (o.items || []).map((it) => ({ ...it, image: it.image || imageKeyByName(it.name) }))
        }));
        this.setData({ orders }, () => this.refresh());
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ orders: [] }, () => this.refresh());
      });
  },
  refresh() {
    const orders = this.data.orders || [];
    const activeTab = this.data.activeTab;
    let filtered = orders;
    if (activeTab === 'pending_pay') filtered = orders.filter((o) => o.status === '待支付');
    else if (activeTab === 'pending_pick') filtered = orders.filter((o) => o.status === '待取餐');
    else if (activeTab === 'done') filtered = orders.filter((o) => o.status === '已完成');
    const expandedMap = this.data.expandedMap || {};
    const filteredOrders = filtered.map((o) => {
      const items = o.items || [];
      const first = items[0];
      const hasMore = items.length > 1;
      const extraItems = hasMore ? items.slice(1).map((it) => ({ ...it, imagePath: getItemImagePath(it.image) })) : [];
      return {
        ...o,
        dateText: formatOrderTime(o.createTime),
        statusColor: STATUS_COLOR[o.status] || '#666',
        firstName: first ? itemBaseName(first) : '订单商品',
        firstOptions: first ? itemOptions(first) : '',
        firstImage: first ? getItemImagePath(first.image) : '',
        serviceLabel: o.deliveryMode === 'delivery' ? '外卖' : '自取',
        hasMore,
        expanded: !!expandedMap[o.id],
        extraItems,
        totalPrice: Number(o.totalPrice || 0).toFixed(2)
      };
    });
    const emptyHint = filtered.length === 0 ? (activeTab === 'all' ? '暂无订单历史' : `暂无${TABS.find((x) => x.key === activeTab).label}订单`) : '';
    this.setData({ filteredOrders, emptyHint });
  },
  setTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key });
    this.refresh();
  },
  toggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    const expandedMap = { ...this.data.expandedMap, [id]: !this.data.expandedMap[id] };
    this.setData({ expandedMap });
    this.refresh();
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${e.currentTarget.dataset.id}` });
  },
  payOrder(e) {
    const id = e.currentTarget.dataset.id;
    const order = (this.data.orders || []).find((o) => o.id === id);
    if (!order) return;

    const items = (order.items || []).map((it) => ({
      id: it.id,
      name: it.name,
      price: Number(it.price || 0),
      image: it.image || null,
      qty: Number(it.qty || 0)
    }));

    if (app.setCart) app.setCart(items);
    if (app.setDeliveryMode) app.setDeliveryMode(order.deliveryMode || 'self');
    if (order.deliveryMode !== 'delivery' && order.store && order.store.id && app.setPickupStoreId) {
      app.setPickupStoreId(order.store.id);
    }

    wx.navigateTo({ url: '/pages/checkout/checkout?repayOrderNo=' + encodeURIComponent(order.id) });
  },
  confirmOrder(e) {
    const orderNo = e.currentTarget.dataset.id;
    wx.showLoading({ title: '提交中...' });
    confirmOrder({ order_no: orderNo })
      .then(() => {
        wx.hideLoading();
        this.loadFromDb();
      })
      .catch(() => {
        wx.hideLoading();
        this.loadFromDb();
      });
  }
});
