import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useOrders } from '../order/OrderContext';
import { getItemImage } from '../utils/itemImages';

const ORANGE = '#ffcc00';
const STATUS_BG = {
  待支付: '#ff9500',
  待取餐: '#4facfe',
  已完成: '#07c160'
};

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

function formatCurrency(v) {
  return `¥ ${Number(v || 0).toFixed(2)}`;
}

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { orders } = useOrders();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.headerBack}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>订单详情</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>未找到该订单</Text>
        </View>
      </View>
    );
  }

  const totalQty = order.totalQty || (order.items || []).reduce((s, x) => s + (x.qty || 0), 0);
  const items = order.items || [];
  const itemImageSource = (item) => getItemImage(item && item.image ? { image: item.image } : item);
  const paymentAmount = order.totalPrice || 0;
  const createTimeText = formatOrderTimeFull(order.createTime);
  const statusText = order.status || '';
  const isPendingPay = statusText === '待支付';
  const paidTimeText = isPendingPay ? '--:--:--' : createTimeText;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单详情</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 顶部状态条 */}
        <View style={[styles.statusBanner, { backgroundColor: STATUS_BG[statusText] || ORANGE }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {/* 消费信息 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>消费信息</Text>

          {items.map((it) => (
            <View key={it.id} style={styles.detailItemRow}>
              <View style={styles.detailThumb}>
                {itemImageSource(it) ? (
                  <Image source={itemImageSource(it)} style={styles.detailThumbImg} resizeMode="cover" />
                ) : (
                  <View style={styles.detailThumbPlaceholder}>
                    <Text style={styles.detailThumbText}>图</Text>
                  </View>
                )}
              </View>
              <View style={styles.detailItemInfo}>
                <Text style={styles.detailItemName} numberOfLines={2}>
                  {it.name}
                </Text>
              </View>
              <View style={styles.detailItemRight}>
                <Text style={styles.detailItemQty}>x{it.qty || 1}</Text>
                <Text style={styles.detailItemPrice}>{formatCurrency((it.price || 0) * (it.qty || 1))}</Text>
              </View>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>数量</Text>
            <Text style={styles.rowValue}>x{totalQty}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>商品总额</Text>
            <Text style={styles.rowValue}>{formatCurrency(order.totalPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>合计</Text>
            <Text style={styles.rowValue}>{formatCurrency(order.totalPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>实际支付（线上支付）</Text>
            <Text style={[styles.rowValue, styles.rowValueHighlight]}>{formatCurrency(paymentAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>收款时间</Text>
            <Text style={styles.rowValue}>{paidTimeText}</Text>
          </View>
        </View>

        {/* 订单信息 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>订单编号</Text>
            <Text style={styles.rowValue}>{order.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>创建时间</Text>
            <Text style={styles.rowValue}>{createTimeText}</Text>
          </View>
        </View>
      </ScrollView>

      {isPendingPay && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.payBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.payBtnText}>去支付</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerBtn: { padding: 8 },
  headerBack: { fontSize: 28, color: '#333', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  headerPlaceholder: { width: 44 },
  scroll: { paddingHorizontal: 12, paddingBottom: 24 },
  statusBanner: {
    backgroundColor: ORANGE,
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18
  },
  statusText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#333', marginBottom: 12 },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  detailThumb: { width: 52, height: 52, borderRadius: 8, overflow: 'hidden', marginRight: 10 },
  detailThumbImg: { width: '100%', height: '100%' },
  detailThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailThumbText: { fontSize: 12, color: '#999' },
  detailItemInfo: { flex: 1 },
  detailItemName: { fontSize: 14, color: '#333', fontWeight: '600' },
  detailItemRight: { alignItems: 'flex-end' },
  detailItemQty: { fontSize: 12, color: '#666', marginBottom: 2 },
  detailItemPrice: { fontSize: 14, color: '#333', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  rowLabel: { fontSize: 13, color: '#666' },
  rowValue: { fontSize: 13, color: '#333' },
  rowValueHighlight: { color: '#ff9500', fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#999' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12
  },
  payBtn: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center'
  },
  payBtnText: { fontSize: 16, color: '#fff', fontWeight: '800' }
});

