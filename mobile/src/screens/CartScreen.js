import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useCart } from '../cart/CartContext';
import { getItemImage } from '../utils/itemImages';

const BTN_COLOR = 'rgb(174,127,85)';

export default function CartScreen({ navigation }) {
  const { cart, inc, remove, clear, totalQty, totalPrice } = useCart();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>购物车</Text>
        <TouchableOpacity onPress={clear} disabled={cart.length === 0}>
          <Text style={[styles.clearText, cart.length === 0 && { opacity: 0.4 }]}>清空</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {cart.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>购物车为空</Text>
          </View>
        ) : (
          cart.map((it) => (
            <View key={it.id} style={styles.row}>
              <View style={styles.thumbWrap}>
                {getItemImage(it) ? (
                  <Image source={getItemImage(it)} style={styles.thumbImg} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={{ color: '#999' }}>图</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {it.name}
                </Text>
                <Text style={styles.price}>¥ {Number(it.price).toFixed(2)}</Text>
                <View style={styles.controls}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => inc(it, -1)}>
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{it.qty}</Text>
                  <TouchableOpacity style={[styles.stepBtn, styles.stepBtnAdd]} onPress={() => inc(it, 1)}>
                    <Text style={[styles.stepBtnText, styles.stepBtnAddText]}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => remove(it.id)}>
                    <Text style={styles.removeText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.subTotal}>¥ {(it.price * it.qty).toFixed(2)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLine}>共 {totalQty} 件</Text>
          <Text style={styles.footerTotal}>
            合计 <Text style={styles.footerTotalNum}>¥ {totalPrice.toFixed(2)}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, totalQty === 0 && { opacity: 0.5 }]}
          disabled={totalQty === 0}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.payText}>去下单</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4, minWidth: 60 },
  backText: { fontSize: 16, color: '#333', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700' },
  clearText: { fontSize: 13, color: '#f56c6c' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10
  },
  thumbWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', marginRight: 10 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: '#333' },
  price: { fontSize: 13, color: '#666', marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BTN_COLOR,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnAdd: { backgroundColor: BTN_COLOR },
  stepBtnText: { fontSize: 16, fontWeight: '700', color: BTN_COLOR, lineHeight: 16 },
  stepBtnAddText: { color: '#fff' },
  qty: { width: 28, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  removeBtn: { marginLeft: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#f7f7f7' },
  removeText: { fontSize: 12, color: '#666' },
  subTotal: { fontSize: 13, fontWeight: '700', color: '#333', marginLeft: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerLine: { fontSize: 12, color: '#666' },
  footerTotal: { fontSize: 14, color: '#333', marginTop: 4 },
  footerTotalNum: { fontSize: 18, fontWeight: '800', color: BTN_COLOR },
  payBtn: { backgroundColor: BTN_COLOR, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22 },
  payText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});

