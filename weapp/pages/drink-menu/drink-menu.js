// pages/drink-menu/drink-menu.js
const app = getApp();
const { categories, items, getItemImagePath } = require('../../utils/menuData.js');

Page({
  data: {
    searchQ: '',
    deliveryMode: 'self',
    mainTab: 'order',
    categories: [],
    activeCatId: '',
    sectioned: [],
    scrollIntoViewId: '',
    hasNoResults: false,
    totalQty: 0,
    totalPrice: '0.00',
    starBase: [1, 2, 3, 4, 5],
    reviews: [
      {
        id: 1,
        avatar: '/assets/user.png',
        nickname: '用户昵称',
        rating: 5,
        date: '2025-12-22',
        content: '这里展示用户评价内容'
      },
      {
        id: 2,
        avatar: '/assets/user.png',
        nickname: '用户昵称',
        rating: 5,
        date: '2025-12-22',
        content: '这里展示用户评价内容'
      },
      {
        id: 3,
        avatar: '/assets/user.png',
        nickname: '用户昵称',
        rating: 5,
        date: '2025-12-22',
        content: '这里展示用户评价内容'
      }
    ],
    storeInfo: {
      minOrder: '15',
      deliveryFee: '1',
      address: 'Jalan Kuchai Maju 9, Kuchai Entrepreneurs Park, 58200 Kuala Lumpur',
      hours: 'Mon to Sat 09:00-20:00',
      phone: '60 15-847 2541'
    }
  },
  onLoad() {
    const deliveryMode = app.getDeliveryMode();
    const catList = categories || [];
    const firstCatId = catList.length ? catList[0].id : '';
    this.sectionTops = [];
    this.sectionCatIds = [];
    this.scrollFromTap = false;
    this.setData({
      deliveryMode,
      categories: catList,
      activeCatId: firstCatId
    });
    this.buildSectioned();
  },
  onShow() {
    const stored = wx.getStorageSync('deliveryMode');
    const deliveryMode = stored || app.getDeliveryMode() || 'self';
    if (deliveryMode && app.setDeliveryMode) app.setDeliveryMode(deliveryMode);
    this.setData({
      deliveryMode,
      totalQty: app.getTotalQty(),
      totalPrice: app.getTotalPrice().toFixed(2)
    });
  },
  buildSectioned() {
    const q = (this.data.searchQ || '').trim().toLowerCase();
    const sectioned = (categories || []).map((cat) => {
      const list = (items || [])
        .filter((i) => i.categoryId === cat.id && (!q || (i.name || '').toLowerCase().includes(q)))
        .map((p) => ({ ...p, imagePath: getItemImagePath(p.image) }));
      return { cat, items: list };
    });
    const hasNoResults = sectioned.length > 0 && sectioned.every((s) => s.items.length === 0);
    this.setData({ sectioned, hasNoResults }, () => {
      const that = this;
      setTimeout(() => that.measureSections(), 200);
    });
  },
  measureSections() {
    const query = wx.createSelectorQuery().in(this);
    query.select('.productCol').boundingClientRect();
    query.select('.productCol').scrollOffset();
    query.selectAll('.sectionBlock').boundingClientRect();
    query.exec((res) => {
      const scrollViewRect = res[0];
      const scrollOffset = res[1];
      const sectionRects = res[2];
      if (!scrollViewRect || !sectionRects || sectionRects.length === 0) return;
      const sectioned = this.data.sectioned.filter((s) => s.items.length > 0);
      if (sectioned.length !== sectionRects.length) return;
      const scrollTop = (scrollOffset && scrollOffset.scrollTop) || 0;
      this.sectionTops = sectionRects.map((r) => r.top - scrollViewRect.top + scrollTop);
      this.sectionCatIds = sectioned.map((s) => s.cat.id);
    });
  },
  onProductScroll(e) {
    if (this.scrollFromTap) return;
    const scrollTop = e.detail.scrollTop || 0;
    const tops = this.sectionTops || [];
    const ids = this.sectionCatIds || [];
    if (ids.length === 0) return;
    const threshold = 80;
    let activeIndex = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] <= scrollTop + threshold) activeIndex = i;
    }
    const nextId = ids[activeIndex];
    if (nextId && this.data.activeCatId !== nextId) {
      this.setData({ activeCatId: nextId });
    }
  },
  onSearch(e) {
    this.setData({ searchQ: e.detail.value });
    this.buildSectioned();
  },
  switchMainTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.mainTab) return;
    this.setData({ mainTab: tab });
  },
  onSelectCategory(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    this.scrollFromTap = true;
    const that = this;
    setTimeout(() => { that.scrollFromTap = false; }, 500);
    this.setData({ activeCatId: id });
    this.setData({ scrollIntoViewId: 'section-' + id });
    setTimeout(() => {
      that.setData({ scrollIntoViewId: '' });
    }, 300);
  },
  setSelf() {
    app.setDeliveryMode('self');
    wx.setStorageSync('deliveryMode', 'self');
    this.setData({ deliveryMode: 'self' });
  },
  setDelivery() {
    app.setDeliveryMode('delivery');
    wx.setStorageSync('deliveryMode', 'delivery');
    this.setData({ deliveryMode: 'delivery' });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${id}` });
  },
  onViewAllReviews() {
    wx.showToast({
      title: '暂无更多评价',
      icon: 'none'
    });
  },
  goCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
  },
  goCheckout() {
    if (this.data.totalQty === 0) return;
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});
