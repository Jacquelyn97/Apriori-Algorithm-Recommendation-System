// pages/product-detail/product-detail.js
const app = getApp();
const { items, getItemImagePath } = require('../../utils/menuData.js');

const ICE_OPTIONS = ['正常冰', '少冰', '去冰', '热'];
const SUGAR_OPTIONS = ['正常糖', '少糖', '半糖', '微糖', '无糖'];
const BASE_OPTIONS = ['珍珠', '椰果', '布丁', '脆啵啵'];

Page({
  data: {
    product: null,
    imagePath: '',
    qty: 1,
    ice: '正常冰',
    sugar: '正常糖',
    bases: [],
    iceOptions: ICE_OPTIONS,
    sugarOptions: SUGAR_OPTIONS,
    baseOptions: BASE_OPTIONS,
    baseOptionsWithSelected: [],
    hasVariants: false,
    variants: [],
    variantQtys: {},
    isSnack: false,
    optionsText: '',
    totalVariantQty: 0,
    btnDisabled: false,
    btnText: '加入购物车'
  },
  onLoad(options) {
    const id = options.id != null ? Number(options.id) : options.id;
    const found = items.find((i) => i.id == id);
    const product = found ? { ...found } : { id, name: '未知商品', price: 0 };
    const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;
    const isSnack = product.categoryId === 'snack';
    const variantQtys = {};
    if (hasVariants && product.variants) {
      product.variants.forEach((v) => { variantQtys[v.id] = 0; });
    }
    const variants = (product.variants || []).map((v) => ({
      ...v,
      imagePath: getItemImagePath(v.image),
      variantQty: 0
    }));
    const optionsText = isSnack ? '' : '正常冰 / 正常糖';
    this.setData({
      product,
      imagePath: getItemImagePath(product.image),
      hasVariants,
      variants,
      variantQtys,
      isSnack,
      optionsText,
      totalVariantQty: 0,
      btnDisabled: hasVariants,
      btnText: hasVariants ? '请先选择口味与数量' : '加入购物车'
    });
    this.setData({
      baseOptionsWithSelected: BASE_OPTIONS.map((b) => ({ name: b, selected: false }))
    });
  },
  setIce(e) {
    this.setData({ ice: e.currentTarget.dataset.val }, () => this.updateOptionsText());
  },
  setSugar(e) {
    this.setData({ sugar: e.currentTarget.dataset.val }, () => this.updateOptionsText());
  },
  toggleBase(e) {
    const b = e.currentTarget.dataset.val;
    const bases = this.data.bases.includes(b)
      ? this.data.bases.filter((x) => x !== b)
      : this.data.bases.concat(b);
    const baseOptionsWithSelected = BASE_OPTIONS.map((x) => ({ name: x, selected: bases.includes(x) }));
    this.setData({ bases, baseOptionsWithSelected }, () => this.updateOptionsText());
  },
  updateOptionsText() {
    const { isSnack, ice, sugar, bases } = this.data;
    if (isSnack) return;
    const baseTxt = bases.length ? ` +${bases.join('、')}` : '';
    const optionsText = `${ice} / ${sugar}${baseTxt}`;
    this.setData({ optionsText });
  },
  incQty() {
    this.setData({ qty: Number(this.data.qty || 0) + 1 });
  },
  decQty() {
    if (Number(this.data.qty || 0) <= 1) return;
    this.setData({ qty: Number(this.data.qty || 0) - 1 });
  },
  setVariantQty(e) {
    const { id, delta } = e.currentTarget.dataset;
    const variantQtys = { ...this.data.variantQtys };
    const d = Number(delta || 0);
    variantQtys[id] = Math.max(0, Number(variantQtys[id] || 0) + d);
    const totalVariantQty = Object.values(variantQtys).reduce((s, n) => s + Number(n || 0), 0);
    const product = this.data.product;
    const variants = (product.variants || []).map((v) => ({
      ...v,
      imagePath: getItemImagePath(v.image),
      variantQty: Number(variantQtys[v.id] || 0)
    }));
    this.setData({
      variantQtys,
      variants,
      totalVariantQty,
      btnDisabled: totalVariantQty === 0,
      btnText: totalVariantQty === 0 ? '请先选择口味与数量' : '加入购物车'
    });
  },
  addToCart() {
    const { product, qty, ice, sugar, bases, hasVariants, variantQtys, isSnack, optionsText } = this.data;
    if (hasVariants) {
      const total = Object.values(variantQtys).reduce((s, n) => s + n, 0);
      if (total === 0) return;
      (product.variants || []).forEach((v) => {
        const q = variantQtys[v.id] || 0;
        if (q <= 0) return;
        const cartItem = {
          id: `${product.id}_${v.id}`,
          name: `${product.name}（${v.name}）`,
          price: v.price,
          image: v.image,
          categoryId: product.categoryId,
          qty: 0
        };
        app.addToCart(cartItem, q);
      });
    } else if (isSnack) {
      const cartItem = { ...product, name: product.name, qty: 0 };
      app.addToCart(cartItem, qty);
    } else {
      const cartId = `${product.id}_${ice}_${sugar}_${(bases.slice().sort().join('-') || 'none')}`;
      const cartItem = {
        ...product,
        id: cartId,
        name: `${product.name}（${optionsText}）`,
        qty: 0
      };
      app.addToCart(cartItem, qty);
    }
    wx.navigateBack();
  }
});
