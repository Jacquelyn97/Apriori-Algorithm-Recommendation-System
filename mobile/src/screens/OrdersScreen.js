import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useOrders } from '../order/OrderContext';
import { getItemImage } from '../utils/itemImages';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_pay', label: '待支付' },
  { key: 'pending_pick', label: '待取餐' },
  { key: 'done', label: '完成' }
];

const STATUS_COLOR = {
  待支付: '#ff9500',
  待取餐: '#4facfe',
  已完成: '#07c160'
};

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

export default function OrdersScreen({ navigation }) {
  const { orders, updateStatus } = useOrders();
  const [activeTab, setActiveTab] = useState('all');
  const [expandedMap, setExpandedMap] = useState({});

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'pending_pay') return orders.filter((o) => o.status === '待支付');
    if (activeTab === 'pending_pick') return orders.filter((o) => o.status === '待取餐');
    if (activeTab === 'done') return orders.filter((o) => o.status === '已完成');
    return orders;
  }, [orders, activeTab]);

  const firstItemName = (o) => {
    if (!o.items || o.items.length === 0) return '订单商品';
    return itemBaseName(o.items[0]);
  };

  const firstItemOptions = (o) => {
    if (!o.items || o.items.length === 0) return '';
    return itemOptions(o.items[0]);
  };

  const itemBaseName = (item) => {
    if (!item || !item.name) return '商品';
    return item.name.includes('（') ? item.name.split('（')[0].trim() : item.name;
  };

  const itemOptions = (item) => {
    if (!item) return '';
    if (item.options) return item.options;
    const match = item.name && item.name.match(/（([^）]+)）/);
    return match ? match[1] : '';
  };

  const itemImageSource = (item) => getItemImage(item && item.image ? { image: item.image } : item);

  const serviceLabel = (o) => (o.deliveryMode === 'delivery' ? '外卖' : '自取');

  const firstItemImage = (o) => {
    if (!o.items || o.items.length === 0) return null;
    return itemImageSource(o.items[0]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {activeTab === t.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === 'all' ? '暂无订单历史' : `暂无${TABS.find((x) => x.key === activeTab)?.label || ''}订单`}
            </Text>
          </View>
        ) : (
          filteredOrders.map((o) => {
            const expanded = !!expandedMap[o.id];
            const hasMoreItems = o.items && o.items.length > 1;
            return (
              <View key={o.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.date}>{formatOrderTime(o.createTime)}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[o.status] || '#666' }]}>{o.status}</Text>
              </View>

              <View style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  {firstItemImage(o) ? (
                    <Image source={firstItemImage(o)} style={styles.itemThumbImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemThumbPlaceholder}>
                      <Text style={styles.itemThumbText}>图</Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {firstItemName(o)}
                  </Text>
                  {firstItemOptions(o) ? (
                    <Text style={styles.itemOptions} numberOfLines={2}>
                      {firstItemOptions(o)}
                    </Text>
                  ) : null}
                  <View style={styles.tagWrap}>
                    <Text style={styles.tag}>{serviceLabel(o)}</Text>
                  </View>
                </View>
              </View>

              {hasMoreItems && expanded && o.items.slice(1).map((item, idx) => (
                <View key={item.id || idx} style={[styles.itemRow, styles.itemRowNotFirst]}>
                  <View style={styles.itemThumb}>
                    {itemImageSource(item) ? (
                      <Image source={itemImageSource(item)} style={styles.itemThumbImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.itemThumbPlaceholder}>
                        <Text style={styles.itemThumbText}>图</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {itemBaseName(item)}
                    </Text>
                    {itemOptions(item) ? (
                      <Text style={styles.itemOptions} numberOfLines={2}>
                        {itemOptions(item)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}

              {hasMoreItems && (
                <TouchableOpacity
                  style={styles.expandRow}
                  activeOpacity={0.8}
                  onPress={() =>
                    setExpandedMap((prev) => ({
                      ...prev,
                      [o.id]: !prev[o.id]
                    }))
                  }
                >
                  <Text style={styles.expandText}>
                    {expanded ? '收起商品' : '展开商品'}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.orderId}>订单号: {o.id}</Text>
              <View style={styles.amountBlock}>
                <Text style={styles.totalAmount}>订单金额: ¥{Number(o.totalPrice || 0).toFixed(2)}</Text>
                <Text style={styles.payment}>线上支付: ¥{Number(o.totalPrice || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('OrderDetail', { id: o.id })}>
                  <Text style={styles.actionText}>查看详情</Text>
                </TouchableOpacity>
                {o.status === '待支付' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.primary]} onPress={() => updateStatus(o.id, '待取餐')}>
                    <Text style={[styles.actionText, styles.primaryText]}>去支付</Text>
                  </TouchableOpacity>
                )}
                {o.status === '待取餐' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.primary]} onPress={() => updateStatus(o.id, '已完成')}>
                    <Text style={[styles.actionText, styles.primaryText]}>确认取餐</Text>
                  </TouchableOpacity>
                )}
              </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  headerIcons: { position: 'absolute', right: 12, top: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 18, color: '#333' },
  tabBar: {
    paddingVertical: 14,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: {},
  tabUnderline: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: '#ff9500' },
  tabText: { fontSize: 14, color: '#999' },
  tabTextActive: { fontSize: 14, color: '#ff9500', fontWeight: '700' },
  scrollContent: { padding: 12, paddingBottom: 24 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { fontSize: 13, color: '#666' },
  status: { fontSize: 13, fontWeight: '700' },
  itemRow: { flexDirection: 'row', marginBottom: 10 },
  itemRowNotFirst: { marginTop: 4 },
  itemThumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', marginRight: 10 },
  itemThumbImg: { width: '100%', height: '100%' },
  itemThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemThumbText: { fontSize: 12, color: '#999' },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 4 },
  itemOptions: { fontSize: 12, color: '#666', marginBottom: 2 },
  tagWrap: { marginTop: 4 },
  tag: { fontSize: 11, color: '#ff9500', backgroundColor: '#fff5e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  orderId: { fontSize: 14, color: '#999', marginBottom: 4 },
  amountBlock: { alignItems: 'flex-end', marginBottom: 12 },
  totalAmount: { fontSize: 14, color: '#333', marginBottom: 2 },
  payment: { fontSize: 14, color: '#666' },
  expandRow: { marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  expandText: { fontSize: 12, color: '#666' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#f3f3f3' },
  actionText: { fontSize: 12, color: '#333', fontWeight: '700' },
  primary: { backgroundColor: '#07c160' },
  primaryText: { color: '#fff' }
});
