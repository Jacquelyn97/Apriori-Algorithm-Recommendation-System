import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useCart } from '../cart/CartContext';
import { getItemImage } from '../utils/itemImages';
import { items } from '../data/menuData';

export default function ProductDetailScreen({ route, navigation }) {
  const paramProduct = route.params?.product || {};
  const product = useMemo(() => {
    const found = items.find((i) => i.id == paramProduct.id);
    return found ? { ...found } : paramProduct;
  }, [paramProduct.id]);
  const [qty, setQty] = useState(1);
  const { inc: incCart } = useCart();

  const ICE_OPTIONS = useMemo(() => ['正常冰', '少冰', '去冰', '热'], []);
  const SUGAR_OPTIONS = useMemo(() => ['正常糖', '少糖', '半糖', '微糖', '无糖'], []);
  const BASE_OPTIONS = useMemo(() => ['珍珠', '椰果', '布丁', '脆啵啵'], []);

  const [ice, setIce] = useState('正常冰');
  const [sugar, setSugar] = useState('正常糖');
  const [bases, setBases] = useState([]);

  const isSnack = product.categoryId === 'snack';
  const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;

  // 多口味时：每个口味的数量 { variantId: qty }
  const [variantQtys, setVariantQtys] = useState(() => {
    if (!hasVariants) return {};
    const init = {};
    product.variants.forEach((v) => { init[v.id] = 0; });
    return init;
  });

  const incQty = () => setQty((q) => q + 1);
  const decQty = () => setQty((q) => (q > 1 ? q - 1 : 1));

  const setVariantQty = (variantId, delta) => {
    setVariantQtys((prev) => {
      const next = { ...prev };
      const cur = next[variantId] || 0;
      next[variantId] = Math.max(0, cur + delta);
      return next;
    });
  };

  const imgSrc = getItemImage(product);
  const optionsText = useMemo(() => {
    if (isSnack) return null;
    const baseTxt = bases.length ? ` +${bases.join('、')}` : '';
    return `${ice} / ${sugar}${baseTxt}`;
  }, [isSnack, ice, sugar, bases]);

  const goCart = () => {
    if (hasVariants) {
      product.variants.forEach((v) => {
        const q = variantQtys[v.id] || 0;
        if (q <= 0) return;
        const cartItem = {
          id: `${product.id}_${v.id}`,
          name: `${product.name}（${v.name}）`,
          price: v.price,
          image: v.image,
          categoryId: product.categoryId,
        };
        incCart(cartItem, q);
      });
    } else if (isSnack) {
      const cartItem = { ...product, name: product.name };
      incCart(cartItem, qty);
    } else {
      const cartId = `${product.id}_${ice}_${sugar}_${bases.slice().sort().join('-') || 'none'}`;
      const cartItem = {
        ...product,
        id: cartId,
        name: `${product.name}（${optionsText}）`
      };
      incCart(cartItem, qty);
    }
    // 加入购物车后返回上一页（商品列表），不直接跳转购物车
    navigation.goBack();
  };

  const totalVariantQty = hasVariants
    ? Object.values(variantQtys).reduce((s, n) => s + n, 0)
    : 0;

  const toggleBase = (b) => {
    setBases((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const renderChips = (options, value, onChange) => {
    return (
      <View style={styles.chips}>
        {options.map((op) => {
          const active = value === op;
          return (
            <TouchableOpacity
              key={op}
              onPress={() => onChange(op)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{op}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.hero}>
            {imgSrc ? (
              <Image source={imgSrc} style={styles.heroImg} resizeMode="contain" />
            ) : (
              <View style={styles.heroImgPlaceholder}>
                <Text style={{ color: '#999' }}>图</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{product.name}</Text>
          {product.description ? (
            <>
              <Text style={styles.labelSmall}>描述</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </>
          ) : null}
          {product.taste ? (
            <>
              <Text style={styles.labelSmall}>口感</Text>
              <Text style={styles.desc}>{product.taste}</Text>
            </>
          ) : null}
          {product.tagline ? (
            <>
              <Text style={styles.labelSmall}>广告语</Text>
              <Text style={styles.tagline}>{product.tagline}</Text>
            </>
          ) : null}
          {!product.description && !product.taste && !product.tagline && !hasVariants ? (
            <Text style={styles.desc}>可在此展示：介绍、销量、排行、打折信息等。</Text>
          ) : null}
          {hasVariants ? (
            <Text style={styles.desc}>请选择口味及数量后加入购物车</Text>
          ) : (
            <Text style={styles.price}>￥{product.price}</Text>
          )}
          {hasVariants ? null : isSnack ? (
            <Text style={styles.selected}>已选数量：{qty}</Text>
          ) : (
            <Text style={styles.selected}>已选：{optionsText}</Text>
          )}
        </View>

        {hasVariants && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>选择口味</Text>
            {(product.variants || []).map((v) => {
              const q = variantQtys[v.id] || 0;
              const vImg = getItemImage(v);
              return (
                <View key={v.id} style={styles.variantRow}>
                  <View style={styles.variantThumb}>
                    {vImg ? (
                      <Image source={vImg} style={styles.variantThumbImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.variantThumbPlaceholder}>
                        <Text style={styles.variantThumbText}>图</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantName}>{v.name}</Text>
                    <Text style={styles.variantPrice}>￥{v.price}</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={[styles.stepBtn, q <= 0 && styles.stepBtnDisabled]}
                        onPress={() => setVariantQty(v.id, -1)}
                        disabled={q <= 0}
                      >
                        <Text style={styles.stepBtnRaw}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qty}>{q}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => setVariantQty(v.id, 1)}>
                        <Text style={styles.stepBtnRaw}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {!isSnack && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>冰度</Text>
          {renderChips(ICE_OPTIONS, ice, setIce)}

          <Text style={styles.sectionTitle}>糖度</Text>
          {renderChips(SUGAR_OPTIONS, sugar, setSugar)}

          <Text style={styles.sectionTitle}>底料</Text>
          <View style={styles.chips}>
            {BASE_OPTIONS.map((b) => {
              const active = bases.includes(b);
              return (
                <TouchableOpacity
                  key={b}
                  onPress={() => toggleBase(b)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        )}

        <View style={styles.card}>
          {!hasVariants && (
            <View style={styles.qtyRow}>
              <Text style={styles.label}>数量</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={decQty} style={styles.stepBtn}>
                  <Text style={styles.stepBtnRaw}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity onPress={incQty} style={styles.stepBtn}>
                  <Text style={styles.stepBtnRaw}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {hasVariants && totalVariantQty > 0 && (
            <Text style={styles.selected}>已选共 {totalVariantQty} 件</Text>
          )}
          <TouchableOpacity
            style={[styles.btn, (hasVariants && totalVariantQty === 0) && styles.btnDisabled]}
            onPress={goCart}
            disabled={hasVariants && totalVariantQty === 0}
          >
            <Text style={styles.btnText}>
              {hasVariants && totalVariantQty === 0 ? '请先选择口味与数量' : '加入购物车'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 0
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  hero: { alignItems: 'center', marginBottom: 12 },
  heroImg: { width: '100%', maxWidth: 320, height: 200, borderRadius: 12 },
  heroImgPlaceholder: { width: '100%', maxWidth: 320, height: 200, borderRadius: 12, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  desc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  labelSmall: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2
  },
  tagline: {
    fontSize: 14,
    color: '#b45309',
    fontStyle: 'italic',
    marginBottom: 8
  },
  price: {
    fontSize: 22,
    color: '#07c160',
    fontWeight: '700'
  },
  selected: { marginTop: 10, fontSize: 12, color: '#666', fontWeight: '700' },
  sectionTitle: { marginTop: 6, marginBottom: 8, fontSize: 14, fontWeight: '800', color: '#333' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f3f3f3' },
  chipActive: { backgroundColor: '#07c160' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#333' },
  chipTextActive: { color: '#fff' },
  variantRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  variantThumb: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', marginRight: 12 },
  variantThumbImg: { width: '100%', height: '100%' },
  variantThumbPlaceholder: { width: '100%', height: '100%', backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  variantThumbText: { fontSize: 12, color: '#999' },
  variantInfo: { flex: 1 },
  variantName: { fontSize: 15, fontWeight: '700', color: '#333' },
  variantPrice: { fontSize: 14, color: '#07c160', fontWeight: '700', marginTop: 2 },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0
  },
  label: {
    fontSize: 16,
    fontWeight: '600'
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepBtnRaw: { fontSize: 18, fontWeight: '900', color: '#333', lineHeight: 18 },
  qty: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600'
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#07c160',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center'
  },
  btnDisabled: { backgroundColor: '#ccc', opacity: 0.8 },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

