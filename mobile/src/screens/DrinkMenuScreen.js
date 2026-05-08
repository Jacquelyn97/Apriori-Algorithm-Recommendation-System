import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  FlatList
} from 'react-native';
import { categories, items } from '../data/menuData';
import { useCart } from '../cart/CartContext';
import { getItemImage } from '../utils/itemImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BTN_COLOR = 'rgb(174,127,85)';
const CART_ICON = require('../../assets/cart.png');
const USER_AVATAR = require('../../assets/user.png');
// 左侧分类栏宽度（单列列表也需要给左侧留出空间）
const LEFT_WIDTH = 0;
const RIGHT_PADDING = 12;
const CARD_WIDTH = SCREEN_WIDTH - LEFT_WIDTH - RIGHT_PADDING * 2;

const TOP_TABS = [
  { key: 'order', label: '点餐' },
  { key: 'comment', label: '评价' },
  { key: 'store', label: '商店' }
];



export default function DrinkMenuScreen({ navigation }) {
  const [searchQ, setSearchQ] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [activeTopTab, setActiveTopTab] = useState('order'); // order | comment | store
  const listRef = useRef(null);
  const pagerRef = useRef(null);
  const { totalQty, totalPrice, deliveryMode, setDeliveryMode } = useCart();

  const normalizedQuery = useMemo(() => searchQ.trim().toLowerCase(), [searchQ]);

  const sectioned = useMemo(() => {
    return categories.map((cat) => {
      const list = items.filter((i) => {
        if (i.categoryId !== cat.id) return false;
        if (!normalizedQuery) return true;
        return i.name.toLowerCase().includes(normalizedQuery);
      });
      return { cat, items: list };
    });
  }, [normalizedQuery]);

  const { listData, headerIndexByCatId } = useMemo(() => {
    const data = [];
    const headerIndexMap = {};
    for (const sec of sectioned) {
      const title = sec.cat.sectionTitle != null ? sec.cat.sectionTitle : (sec.cat.id === 'snack' ? sec.cat.name : `${sec.cat.name}系列`);
      headerIndexMap[sec.cat.id] = data.length;
      data.push({ type: 'header', catId: sec.cat.id, title });
      if (sec.items.length === 0) {
        data.push({ type: 'empty', catId: sec.cat.id, key: `empty_${sec.cat.id}` });
        continue;
      }
      for (const p of sec.items) {
        data.push({ type: 'product', p, key: `p_${sec.cat.id}_${p.id}` });
      }
    }
    return { listData: data, headerIndexByCatId: headerIndexMap };
  }, [sectioned]);

  const onPressCat = useCallback(
    (catId) => {
      setActiveCategory(catId);
      const idx = headerIndexByCatId[catId];
      if (idx === undefined) return;
      listRef.current?.scrollToIndex({ index: idx, viewPosition: 0 });
    },
    [headerIndexByCatId]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const firstHeader = viewableItems.find((v) => v?.item?.type === 'header');
    if (firstHeader?.item?.catId) setActiveCategory(firstHeader.item.catId);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 30 }).current;

  const setTabByIndex = useCallback((index) => {
    const next = TOP_TABS[index]?.key;
    if (next) setActiveTopTab(next);
  }, []);

  const scrollToTab = useCallback((key) => {
    const idx = TOP_TABS.findIndex((t) => t.key === key);
    if (idx < 0) return;
    setActiveTopTab(key);
    pagerRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, y: 0, animated: true });
  }, []);

  const renderProductCard = (p) => {
    if (!p) return null;
    const imgSrc = getItemImage(p);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.itemCard}
        onPress={() => navigation.navigate('ProductDetail', { product: p })}
      >
        <View style={styles.itemImgWrap}>
          {imgSrc ? (
            <Image source={imgSrc} style={styles.itemImg} resizeMode="cover" />
          ) : (
            <View style={styles.itemImgPlaceholder}>
              <Text style={styles.placeholderText}>图</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemName} numberOfLines={2}>
          {p.name}
        </Text>
        <Text style={styles.itemPrice}>¥ {p.price}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
        </View>
      );
    }
    if (item.type === 'empty') {
      return (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>暂无匹配商品</Text>
        </View>
      );
    }
    if (item.type === 'product') {
      return <View style={styles.productRow}>{renderProductCard(item.p)}</View>;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* 顶部：自助点餐 + 奶茶馆 + 领券 + 自取/外卖 */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.storeSelect}>
            <Text style={styles.storeText}>奶茶馆 &gt;</Text>
          </TouchableOpacity>
          <View style={styles.modeWrap}>
            <TouchableOpacity
              style={[styles.modeBtn, deliveryMode === 'self' && styles.modeBtnActive]}
              onPress={() => setDeliveryMode('self')}
            >
              <Text style={deliveryMode === 'self' ? styles.modeTextActive : styles.modeText}>自取</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, deliveryMode === 'delivery' && styles.modeBtnActive]}
              onPress={() => setDeliveryMode('delivery')}
            >
              <Text style={deliveryMode === 'delivery' ? styles.modeTextActive : styles.modeText}>外卖</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.couponRow}>
          <View style={styles.couponTags}>
            <Text style={styles.couponTag}>满99减25</Text>
            <Text style={styles.couponTag}>满100享8折</Text>
          </View>
          <Text style={styles.couponLink}>去领券 &gt;</Text>
        </View>
      </View>

      {/* 点餐 | 评价 | 商店 + 搜索 */}
      <View style={styles.navRow}>
        <View style={styles.tabs}>
          {TOP_TABS.map((t) => {
            const active = activeTopTab === t.key;
            return (
              <TouchableOpacity key={t.key} activeOpacity={0.8} onPress={() => scrollToTab(t.key)}>
                <Text style={[styles.tab, active && styles.tabActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="请输入商品名称"
          placeholderTextColor="#999"
          value={searchQ}
          onChangeText={setSearchQ}
        />
      </View>

      {/* 内容区：点餐 / 评价 / 商店（横向滑动切换） */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const x = e?.nativeEvent?.contentOffset?.x || 0;
          const idx = Math.round(x / SCREEN_WIDTH);
          setTabByIndex(idx);
        }}
        style={styles.pager}
      >
        {/* 1) 点餐页：左侧分类 + 右侧商品 */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.main}>
            <ScrollView style={styles.leftMenu} showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catItem, activeCategory === cat.id && styles.catItemActive]}
                  onPress={() => onPressCat(cat.id)}
                >
                  <Text style={[styles.catText, activeCategory === cat.id && styles.catTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              ref={listRef}
              data={listData}
              keyExtractor={(x, idx) => x.key || `${x.type}_${idx}`}
              renderItem={renderItem}
              style={styles.rightList}
              contentContainerStyle={styles.rightListContent}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* 2) 评价页 */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
            {['用户昵称', '用户昵称', '用户昵称'].map((u, idx) => (
              <View key={idx} style={styles.commentCard}>
                <View style={styles.commentTop}>
                  <Image source={USER_AVATAR} style={styles.avatar} resizeMode="cover" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.commentHeadRow}>
                      <Text style={styles.username}>{u}</Text>
                      <Text style={styles.date}>2025-12-22</Text>
                    </View>
                    <Text style={styles.stars}>★★★★★</Text>
                    <Text style={styles.commentText}>这里展示用户评价内容</Text>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.showMore} activeOpacity={0.8}>
              <Text style={styles.showMoreText}>查看全部评论 &gt;</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3) 商店页 */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>配送信息</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>起送</Text>
                <Text style={styles.infoVal}>最低 ¥15 起送</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>配送费</Text>
                <Text style={styles.infoVal}>¥1</Text>
              </View>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockTitle}>店铺信息</Text>
              <View style={styles.infoRow}>
                <Image source={require('../../assets/location.png')} style={styles.infoIcon} />
                <Text style={styles.infoVal}>Jalan Kuchai Maju 9, Kuchai Entrepreneurs Park, 58200 Kuala Lumpur</Text>
              </View>
              <View style={styles.infoRow}>
                <Image source={require('../../assets/alarm-clock.png')} style={styles.infoIcon} />
                <Text style={styles.infoVal}>Mon to Sat 09:00 - 20:00</Text>
              </View>
              <View style={styles.infoRow}>
                <Image source={require('../../assets/telephone.png')} style={styles.infoIcon} />
                <Text style={styles.infoVal}>60 15-847 2541</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* 底部购物车 + 结算 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cartInfo} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.cartIconWrap}>
            <Image source={CART_ICON} style={styles.cartIconImg} resizeMode="contain" />
          </View>
          <Text style={styles.cartLabel}>
            {totalQty === 0 ? '未选购商品' : `已选 ${totalQty} 件  ¥${totalPrice.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => totalQty > 0 && navigation.navigate('Cart')}
        >
          <Text style={styles.submitBtnText}>结算</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  storeSelect: {},
  storeText: { fontSize: 18, color: '#333' },
  modeWrap: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 999,
    padding: 2
  },
  modeBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 },
  modeBtnActive: { backgroundColor: BTN_COLOR },
  modeText: { fontSize: 12, color: '#666' },
  modeTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  couponTags: { flexDirection: 'row', gap: 8 },
  couponTag: {
    fontSize: 11,
    color: '#c00',
    backgroundColor: '#ffe5e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  couponLink: { fontSize: 12, color: '#07c160' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tabs: { flexDirection: 'row', marginRight: 12 },
  tab: { fontSize: 14, color: '#666', marginRight: 16 },
  tabActive: { color: '#c00', fontWeight: '600', borderBottomWidth: 2, borderBottomColor: '#c00' },
  searchBar: {
    flex: 1,
    height: 35,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    fontSize: 13
  },
  pager: { flex: 1, backgroundColor: '#fff' },
  page: { flex: 1, backgroundColor: '#f8f8f8' },
  main: { flex: 1, flexDirection: 'row' },
  leftMenu: { width: LEFT_WIDTH, backgroundColor: '#f2f2f2' },
  catItem: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  catItemActive: { backgroundColor: '#fff' },
  catText: { fontSize: 13, color: '#666' },
  catTextActive: { fontSize: 13, color: '#333', fontWeight: '600' },
  rightList: { flex: 1, backgroundColor: '#fff' },
  rightListContent: { paddingHorizontal: RIGHT_PADDING, paddingTop: 8, paddingBottom: 120, alignItems: 'stretch' },
  sectionHeader: { paddingTop: 10, paddingBottom: 8 },
  sectionHeaderText: { fontSize: 14, fontWeight: '700', color: '#333' },
  emptyRow: { paddingVertical: 14 },
  emptyText: { fontSize: 12, color: '#999' },
  productRow: { paddingVertical: 10, alignItems: 'stretch' },
  itemCard: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center'
  },
  itemImgWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden'
  },
  itemImg: { width: '100%', height: '100%' },
  itemImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: { fontSize: 12, color: '#999' },
  itemName: { fontSize: 13, color: '#333', marginTop: 8, textAlign: 'center', maxWidth: '100%' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  cartInfo: { flexDirection: 'row', alignItems: 'center' },
  cartIconWrap: { width: 24, height: 24, marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  cartIconImg: { width: 22, height: 22 },
  cartLabel: { fontSize: 14, color: '#333' },
  submitBtn: {
    backgroundColor: BTN_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20
  },
  submitBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },

  commentCard: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 12 },
  commentTop: { flexDirection: 'row' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8e8e8' },
  commentHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { fontSize: 14, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#999' },
  stars: { marginTop: 4, color: '#f4c430' },
  commentText: { marginTop: 6, fontSize: 13, color: '#333' },
  showMore: { marginTop: 12, alignItems: 'center' },
  showMoreText: { fontSize: 13, color: '#666' },

  block: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 12 },
  blockTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoIcon: { width: 16, height: 16, marginRight: 8, resizeMode: 'contain' },
  infoVal: { flex: 1, color: '#333', fontSize: 13 }
});
