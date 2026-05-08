// 全局状态（替代 React Context）
let nextCustomerNum = 1;

function normalizeItem(item) {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    image: item.image || null,
    qty: Number(item.qty || 0)
  };
}

App({
  globalData: {
    loggedIn: false,
    cart: [],
    deliveryMode: 'self',
    pickupStoreId: 'kuchai',
    address: { name: '', phone: '', detail: '' },
    addresses: [
      { id: 'addr1', region: 'Malaysia Selangor Seri Kembangan', street: '2 Jalan Bunga 1/5 Taman Bunga Raya', name: 'Jacquelyn', phone: '125248864', isDefault: true },
      { id: 'addr2', region: 'Malaysia Selangor Petaling Jaya', street: '6 Jalan SK 2/9 Taman Indah Damansara', name: 'ChaiYing', phone: '185426518', isDefault: false }
    ],
    selectedAddressId: 'addr1',
    orders: [],
    nextCustomerNum: 1
  },

  getCart() {
    return this.globalData.cart;
  },
  setCart(cart) {
    this.globalData.cart = cart || [];
  },
  addToCart(item, delta = 1) {
    const list = this.globalData.cart.slice();
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      const qty = Number(list[idx].qty || 0) + Number(delta || 0);
      if (qty <= 0) list.splice(idx, 1);
      else list[idx] = normalizeItem({ ...list[idx], qty });
    } else if (delta > 0) {
      list.push(normalizeItem({ ...item, qty: delta }));
    }
    this.globalData.cart = list;
    return list;
  },
  setQty(item, qty) {
    const list = this.globalData.cart.slice();
    const idx = list.findIndex((x) => x.id === item.id);
    const q = Number(qty || 0);
    if (q <= 0 && idx >= 0) {
      list.splice(idx, 1);
    } else if (idx >= 0) {
      list[idx] = normalizeItem({ ...item, qty: q });
    } else if (q > 0) {
      list.push(normalizeItem({ ...item, qty: q }));
    }
    this.globalData.cart = list;
    return list;
  },
  removeFromCart(id) {
    this.globalData.cart = this.globalData.cart.filter((x) => x.id !== id);
  },
  clearCart() {
    this.globalData.cart = [];
  },
  getTotalQty() {
    return this.globalData.cart.reduce((s, x) => s + (x.qty || 0), 0);
  },
  getTotalPrice() {
    return this.globalData.cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 0), 0);
  },
  getDeliveryMode() {
    return this.globalData.deliveryMode;
  },
  setDeliveryMode(mode) {
    this.globalData.deliveryMode = mode;
  },
  getPickupStoreId() {
    return this.globalData.pickupStoreId;
  },
  setPickupStoreId(id) {
    this.globalData.pickupStoreId = id;
  },
  getAddress() {
    return this.globalData.address;
  },
  setAddress(addr) {
    this.globalData.address = addr || { name: '', phone: '', detail: '' };
  },
  getAddresses() {
    return this.globalData.addresses;
  },
  setAddresses(list) {
    this.globalData.addresses = list || [];
  },
  getSelectedAddressId() {
    return this.globalData.selectedAddressId;
  },
  setSelectedAddressId(id) {
    this.globalData.selectedAddressId = id;
  },
  getSelectedAddress() {
    const list = this.globalData.addresses;
    const id = this.globalData.selectedAddressId;
    return list.find((a) => a.id === id) || list.find((a) => a.isDefault) || list[0] || null;
  },
  addAddress(addr) {
    const id = 'addr' + Date.now();
    const newAddr = { ...addr, id, isDefault: addr.isDefault || false };
    let list = this.globalData.addresses.slice();
    if (newAddr.isDefault) list = list.map((a) => ({ ...a, isDefault: false }));
    list.push(newAddr);
    this.globalData.addresses = list;
    return id;
  },
  updateAddress(id, updates) {
    let list = this.globalData.addresses.map((a) => (a.id !== id ? a : { ...a, ...updates }));
    if (updates.isDefault) list = list.map((a) => ({ ...a, isDefault: a.id === id }));
    this.globalData.addresses = list;
  },
  removeAddress(id) {
    const list = this.globalData.addresses.filter((a) => a.id !== id);
    const removed = this.globalData.addresses.find((a) => a.id === id);
    if (removed && removed.isDefault && list.length && !list.some((a) => a.isDefault)) {
      list[0] = { ...list[0], isDefault: true };
    }
    this.globalData.addresses = list;
    if (this.globalData.selectedAddressId === id) this.globalData.selectedAddressId = list[0] ? list[0].id : null;
  },
  removeAddresses(ids) {
    if (!ids || !ids.length) return;
    const set = new Set(ids);
    let list = this.globalData.addresses.filter((a) => !set.has(a.id));
    const hadDefault = this.globalData.addresses.some((a) => set.has(a.id) && a.isDefault);
    if (hadDefault && list.length && !list.some((a) => a.isDefault)) list[0] = { ...list[0], isDefault: true };
    this.globalData.addresses = list;
    if (ids.includes(this.globalData.selectedAddressId)) this.globalData.selectedAddressId = list[0] ? list[0].id : null;
  },
  setAddressDefault(id) {
    this.globalData.addresses = this.globalData.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
  },
  getOrders() {
    return this.globalData.orders;
  },
  createOrder(payload) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const n = this.globalData.nextCustomerNum++;
    const id = payload && payload.id ? payload.id : `ORD${y}${m}${d}${h}${min}E${String(n).padStart(3, '0')}`;
    const safePayload = { ...(payload || {}) };
    delete safePayload.id;
    const order = { id, createTime: now.toISOString(), status: (payload && payload.status) || '待支付', ...safePayload };
    this.globalData.orders = [order, ...this.globalData.orders];
    return id;
  },
  updateOrderStatus(id, status) {
    this.globalData.orders = this.globalData.orders.map((o) => (o.id === id ? { ...o, status } : o));
  },
  removeOrder(id) {
    this.globalData.orders = (this.globalData.orders || []).filter((o) => o.id !== id);
  }
});
