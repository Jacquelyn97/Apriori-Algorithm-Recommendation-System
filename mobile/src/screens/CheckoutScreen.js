import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal
} from 'react-native';
import { useCart } from '../cart/CartContext';
import { useOrders } from '../order/OrderContext';
import { getItemImage } from '../utils/itemImages';
import * as Location from 'expo-location';

const BTN_COLOR = 'rgb(174,127,85)';
const ORANGE = '#ff9500';
const WORK_START = 9 * 60; // 09:00 in minutes
const WORK_END = 20 * 60 - 5; // 19:55 in minutes (下班前5分钟)
const SLOT_INTERVAL = 15;
const haversine = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function getTimeSlots() {
  const slots = [];
  for (let m = WORK_START; m < WORK_END; m += SLOT_INTERVAL) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  slots.push('19:55');
  return slots;
}

const ALL_TIME_SLOTS = getTimeSlots();

function formatDeliveryTimeRange() {
  const now = new Date();
  const start = new Date(now.getTime() + 15 * 60000);
  const end = new Date(now.getTime() + 20 * 60000);
  const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `约${fmt(start)} - ${fmt(end)}送达`;
}

function getValidTimeSlotsForDate(dateKey, now) {
  if (dateKey === 'tomorrow') return ALL_TIME_SLOTS;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const buffer = 15;
  const startMinutes = Math.min(WORK_END, Math.max(WORK_START, currentMinutes + buffer));
  const slots = [];
  for (let m = WORK_START; m < WORK_END; m += SLOT_INTERVAL) {
    const timeStr = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (m >= startMinutes) slots.push(timeStr);
  }
  if (startMinutes <= WORK_END) slots.push('19:55');
  return slots;
}

function canSelectToday(now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes < WORK_END;
}

function getTimeSlotRanges(dateKey, now) {
  const slots = getValidTimeSlotsForDate(dateKey, now);
  return slots.map((start) => {
    const [h, m] = start.split(':').map(Number);
    const endM = (h * 60 + m + 20) % (24 * 60);
    const endH = Math.floor(endM / 60);
    const endMin = endM % 60;
    const endStr = `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    return { value: start, label: `${start}-${endStr}` };
  });
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function getTodayLabel() {
  const d = new Date();
  return `今日(${WEEKDAYS[d.getDay()]})`;
}
function getTomorrowLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `明日(${WEEKDAYS[d.getDay()]})`;
}

export default function CheckoutScreen({ navigation }) {
  const { cart, clear, totalQty, totalPrice, deliveryMode, setDeliveryMode, address } = useCart();
  const { createOrder } = useOrders();
  const [paymentMethod, setPaymentMethod] = useState('tng'); // 'tng' | 'visa'
  const [error, setError] = useState('');
  const [scheduledDelivery, setScheduledDelivery] = useState(null); // null = 立即送出 | { date: 'today'|'tomorrow', time: 'HH:mm' }
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [pickDate, setPickDate] = useState('today');
  const [pickTime, setPickTime] = useState(null); // null = 尽快送达, or 'HH:mm'

  const [stores, setStores] = useState([
    {
      id: 'kuchai',
      name: 'Tea Stories (Kuchai)',
      address: 'Jalan Kuchai Maju 9, Kuchai Entrepreneurs Park',
      icon: require('../../assets/store.png'),
      lat: 3.088849,
      lng: 101.686589,
      distanceKm: null
    },
    {
      id: 'sri-petaling',
      name: 'Tea Stories (Sri Petaling)',
      address: 'Jalan Radin Bagus, Bandar Baru Sri Petaling',
      icon: require('../../assets/store.png'),
      lat: 3.201633,
      lng: 101.624323,
      distanceKm: null
    },
    {
      id: 'cheras',
      name: 'Tea Stories (Cheras)',
      address: 'Jalan Dataran Cheras 3, Dataran Perniagaan Cheras',
      icon: require('../../assets/store.png'),
      lat: 3.035920,
      lng: 101.765402,
      distanceKm: null
    }
  ]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  // const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || null);
  const [showStoreModal, setShowStoreModal] = useState(false);

  const now = useMemo(() => new Date(), []);
  const canToday = canSelectToday(now);
  const canShowTodayInModal = showDeliveryModal ? canSelectToday(new Date()) : canToday;
  const timeSlotsForPick = useMemo(
    () => (showDeliveryModal ? getValidTimeSlotsForDate(pickDate, new Date()) : []),
    [pickDate, showDeliveryModal]
  );
  const timeSlotRanges = useMemo(
    () => (showDeliveryModal ? getTimeSlotRanges(pickDate, new Date()) : []),
    [pickDate, showDeliveryModal]
  );
  const hasImmediateOption = pickDate === 'today';

  const formatStoreDistance = (km) => {
    if (!km && km !== 0) return '';
    return `${km.toFixed(1)} km`;
  };

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) || stores[0] || null,
    [stores, selectedStoreId]
  );

  const deliveryDisplayText = useMemo(() => {
    if (!scheduledDelivery) return formatDeliveryTimeRange();
    const dateStr = scheduledDelivery.date === 'today' ? '今天' : '明天';
    return `${dateStr} ${scheduledDelivery.time} 送达`;
  }, [scheduledDelivery]);

  const onOpenDeliveryModal = () => {
    const nowObj = new Date();
    const canTodayNow = canSelectToday(nowObj);
    const initialDate = canTodayNow ? 'today' : 'tomorrow';
    setPickDate(initialDate);
    // 今天默认“尽快送达”；隔天不默认选中任何时间段，等用户自己点
    setPickTime(initialDate === 'today' ? null : null);
    setShowDeliveryModal(true);
  };

  const onConfirmScheduled = () => {
    // 明日必须选择具体时间；今日可以保持“尽快送达”
    if (!hasImmediateOption && !pickTime) {
      Alert.alert('提示', '请选择送达时间');
      return;
    }
    if (hasImmediateOption && pickTime === null) {
      setScheduledDelivery(null);
    } else {
      setScheduledDelivery({ date: pickDate, time: pickTime });
    }
    setShowDeliveryModal(false);
  };

  const timeScrollRef = useRef(null);
  const pickTimeRef = useRef(pickTime);
  const ITEM_HEIGHT = 48;

  useEffect(() => {
    pickTimeRef.current = pickTime;
  }, [pickTime]);

  useEffect(() => {
    if (!showDeliveryModal || !timeScrollRef.current) return;
    const currentPickTime = pickTimeRef.current;
    let idx = 0;
    if (hasImmediateOption) {
      idx = currentPickTime === null ? 0 : timeSlotsForPick.indexOf(currentPickTime) + 1;
    } else {
      idx = Math.max(0, timeSlotsForPick.indexOf(currentPickTime));
    }
    const y = Math.max(0, idx * ITEM_HEIGHT - 2 * ITEM_HEIGHT);
    timeScrollRef.current.scrollTo({ y, animated: true });
  }, [showDeliveryModal, pickDate, hasImmediateOption, timeSlotsForPick]);

  useEffect(() => {
    let cancelled = false;
  
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // 用户拒绝：退化为默认第一家，不显示距离
          if (!cancelled) {
            setSelectedStoreId((prev) => prev || stores[0]?.id || null);
          }
          return;
        }
  
        const pos = await Location.getCurrentPositionAsync({});
        console.log('USER POSITION', pos.coords);
        const { latitude, longitude } = pos.coords;
  
        const withDistance = stores.map((s) => ({
          ...s,
          distanceKm: haversine(latitude, longitude, s.lat, s.lng)
        }));
  
        // 找最近门店
        withDistance.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  
        if (!cancelled) {
          setStores(withDistance);
          setSelectedStoreId(withDistance[0]?.id || null);
        }
      } catch (e) {
        // 定位失败：同样退化为默认第一家
        if (!cancelled) {
          setSelectedStoreId((prev) => prev || stores[0]?.id || null);
        }
      }
    })();
  
    return () => {
      cancelled = true;
    };
  }, []);

  const addressOk = useMemo(() => {
    if (deliveryMode !== 'delivery') return true;
    return Boolean(address.name && address.phone && address.detail);
  }, [deliveryMode, address]);

  const submit = () => {
    setError('');
    if (totalQty === 0) {
      setError('购物车为空');
      return;
    }
    if (deliveryMode === 'delivery' && !addressOk) {
      Alert.alert('提示', '请选择您的收货地址', [
        { text: '取消', style: 'cancel' },
        { text: '从列表选择', onPress: () => navigation.navigate('AddressList') }
      ]);
      setError('请先选择收货地址');
      return;
    }
    if (deliveryMode !== 'delivery' && !selectedStoreId) {
      Alert.alert('提示', '请选择自取门店');
      setError('请选择自取门店');
      return;
    }
    createOrder({
      deliveryMode,
      address: deliveryMode === 'delivery' ? address : null,
      store: deliveryMode !== 'delivery' ? stores.find((s) => s.id === selectedStoreId) || null : null,
      items: cart.map((x) => {
        const optionsFromName = (x.name && x.name.match(/（([^）]+)）/)) ? x.name.match(/（([^）]+)）/)[1] : '';
        return {
          id: x.id,
          name: x.name,
          price: x.price,
          qty: x.qty,
          image: x.image || null,
          options: x.options != null ? x.options : optionsFromName
        };
      }),
      totalQty,
      totalPrice,
      status: '待取餐'
    });
    clear();
    navigation.navigate('MainTabs', { screen: 'Order' });
  };

  const payLater = () => {
    setError('');
    if (totalQty === 0) {
      setError('购物车为空');
      return;
    }
    if (deliveryMode === 'delivery' && !addressOk) {
      Alert.alert('提示', '请选择您的收货地址', [
        { text: '取消', style: 'cancel' },
        { text: '从列表选择', onPress: () => navigation.navigate('AddressList') }
      ]);
      setError('请先选择收货地址');
      return;
    }
    if (deliveryMode !== 'delivery' && !selectedStoreId) {
      Alert.alert('提示', '请选择自取门店');
      setError('请选择自取门店');
      return;
    }
    createOrder({
      deliveryMode,
      address: deliveryMode === 'delivery' ? address : null,
      store: deliveryMode !== 'delivery' ? stores.find((s) => s.id === selectedStoreId) || null : null,
      items: cart.map((x) => {
        const optionsFromName = (x.name && x.name.match(/（([^）]+)）/)) ? x.name.match(/（([^）]+)）/)[1] : '';
        return {
          id: x.id,
          name: x.name,
          price: x.price,
          qty: x.qty,
          image: x.image || null,
          options: x.options != null ? x.options : optionsFromName
        };
      }),
      totalQty,
      totalPrice,
      status: '待支付'
    });
    clear();
    navigation.goBack();
  };

  const onPressAddress = () => {
    navigation.navigate('AddressList');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>确认订单</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segment, deliveryMode !== 'delivery' && styles.segmentActive]}
            onPress={() => setDeliveryMode('self')}
          >
            <Text style={[styles.segmentText, deliveryMode !== 'delivery' && styles.segmentTextActive]}>自取</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, deliveryMode === 'delivery' && styles.segmentActive]}
            onPress={() => setDeliveryMode('delivery')}
          >
            <Text style={[styles.segmentText, deliveryMode === 'delivery' && styles.segmentTextActive]}>外卖</Text>
          </TouchableOpacity>
        </View>

        {deliveryMode !== 'delivery' && selectedStore && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>自取门店</Text>
            <TouchableOpacity
              style={styles.storeMainRow}
              activeOpacity={0.8}
              onPress={() => setShowStoreModal(true)}
            >
              <View style={styles.storeInfoRow}>
                <Image source={selectedStore.icon} style={styles.storeIcon} />
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{selectedStore.name}</Text>
                  <View style={styles.storeAddressRow}>
                    <Text style={styles.storeAddress} numberOfLines={2}>
                      {selectedStore.address}
                    </Text>
                    {selectedStore.distanceKm != null && (
                      <Text style={styles.storeDistance}>{formatStoreDistance(selectedStore.distanceKm)}</Text>
                    )}
                  </View>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {deliveryMode === 'delivery' && (
          <View style={styles.card}>
            <TouchableOpacity style={styles.addressRow} onPress={onPressAddress}>
              <Text style={addressOk ? styles.addressSelected : styles.addressLabel}>
                {addressOk ? `${address.name} ${address.phone}` : '请选择收货地址'}
              </Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            {addressOk && address.detail ? (
              <Text style={styles.addressDetail} numberOfLines={2}>{address.detail}</Text>
            ) : null}
            <TouchableOpacity style={styles.deliveryRow} onPress={onOpenDeliveryModal}>
              <Text style={styles.deliveryLeft}>
                {scheduledDelivery ? '预约送达' : '立即送出'}
              </Text>
              <View style={styles.deliveryRight}>
                <Text style={styles.deliveryTime}>{deliveryDisplayText}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>确认订单</Text>
          {cart.map((item) => {
            const imgSrc = getItemImage(item?.image ? { image: item.image } : item);
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  {imgSrc ? (
                    <Image source={imgSrc} style={styles.itemImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemThumbPlaceholder}>
                      <Text style={styles.itemThumbText}>图</Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>¥ {Number(item.price || 0).toFixed(2)}</Text>
                    <Text style={styles.itemQty}>x{item.qty || 1}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>数量</Text>
            <Text style={styles.summaryValue}>{totalQty}个</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>合计</Text>
            <Text style={styles.summaryTotal}>¥ {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>支付方式</Text>
          <TouchableOpacity
            style={styles.payRow}
            onPress={() => setPaymentMethod('tng')}
            activeOpacity={0.8}
          >
            <Text style={styles.payName}>TNG</Text>
            <View style={styles.radioWrap}>
              {paymentMethod === 'tng' ? (
                <View style={styles.radioChecked}>
                  <Text style={styles.radioCheck}>✓</Text>
                </View>
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.payRow}
            onPress={() => setPaymentMethod('visa')}
            activeOpacity={0.8}
          >
            <Text style={styles.payName}>Online Bank</Text>
            <View style={styles.radioWrap}>
              {paymentMethod === 'visa' ? (
                <View style={styles.radioChecked}>
                  <Text style={styles.radioCheck}>✓</Text>
                </View>
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <Modal
        visible={showDeliveryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeliveryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeliveryModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择送达时间</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDeliveryModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalTwoCol}>
              <View style={styles.modalLeftCol}>
                {canShowTodayInModal && (
                  <TouchableOpacity
                    style={[styles.modalDayItem, pickDate === 'today' && styles.modalDayItemActive]}
                    onPress={() => {
                      setPickDate('today');
                      setPickTime(null);
                    }}
                  >
                    <Text style={[styles.modalDayText, pickDate === 'today' && styles.modalDayTextActive]}>
                      {getTodayLabel()}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalDayItem, pickDate === 'tomorrow' && styles.modalDayItemActive]}
                  onPress={() => {
                    setPickDate('tomorrow');
                    // 明日不默认选中时间，等待用户点选
                    setPickTime(null);
                  }}
                >
                  <Text style={[styles.modalDayText, pickDate === 'tomorrow' && styles.modalDayTextActive]}>
                    {getTomorrowLabel()}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={timeScrollRef}
                style={styles.modalRightCol}
                contentContainerStyle={styles.timePickerContent}
                showsVerticalScrollIndicator={true}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const index = Math.round(y / ITEM_HEIGHT);
                  const maxIndex = hasImmediateOption
                    ? timeSlotRanges.length
                    : Math.max(timeSlotRanges.length - 1, 0);
                  const clamped = Math.max(0, Math.min(index, maxIndex));
                  if (hasImmediateOption) {
                    if (clamped === 0) {
                      setPickTime(null);
                    } else if (timeSlotsForPick[clamped - 1]) {
                      setPickTime(timeSlotsForPick[clamped - 1]);
                    }
                  } else if (timeSlotsForPick[clamped]) {
                    setPickTime(timeSlotsForPick[clamped]);
                  }
                }}
              >
                {hasImmediateOption && (
                  <TouchableOpacity
                    style={[styles.timeRow, pickTime === null && styles.timeRowActive]}
                    onPress={() => setPickTime(null)}
                  >
                    <View style={styles.timeRowLeft}>
                      <Text style={[styles.timeRowMain, pickTime === null && styles.timeRowMainActive]}>
                        尽快送达
                      </Text>
                      <Text style={styles.timeRowSub}>{formatDeliveryTimeRange().replace('约', '预计')}</Text>
                    </View>
                    {pickTime === null && <Text style={styles.timeRowCheck}>✓</Text>}
                  </TouchableOpacity>
                )}
                {timeSlotRanges.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.timeRow, pickTime === value && styles.timeRowActive]}
                    onPress={() => setPickTime(value)}
                  >
                    <Text style={[styles.timeRowMain, pickTime === value && styles.timeRowMainActive]}>
                      {label}
                    </Text>
                    {pickTime === value && <Text style={styles.timeRowCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalConfirmFull} onPress={onConfirmScheduled}>
                <Text style={styles.modalConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showStoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStoreModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStoreModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择自取门店</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowStoreModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {stores.map((s) => {
              const active = s.id === selectedStoreId;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.storeRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedStoreId(s.id);
                    setShowStoreModal(false);
                  }}
                >
                  <View style={styles.storeInfoRow}>
                    <Image source={s.icon} style={styles.storeIcon} />
                    <View style={styles.storeInfo}>
                      <Text style={styles.storeName}>{s.name}</Text>
                      <View style={styles.storeAddressRow}>
                        <Text style={styles.storeAddress} numberOfLines={2}>
                          {s.address}
                        </Text>
                        {s.distanceKm != null && (
                          <Text style={styles.storeDistance}>{formatStoreDistance(s.distanceKm)}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.storeRadioOuter}>
                    {active && <View style={styles.storeRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payLaterBtn} onPress={payLater}>
          <Text style={styles.payLaterText}>稍后支付</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitText}>提交订单</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerBtn: { padding: 8 },
  headerBack: { fontSize: 28, color: '#333', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  headerPlaceholder: { width: 44 },
  scroll: { padding: 16, paddingBottom: 100 },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 4
  },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: ORANGE },
  segmentText: { fontSize: 15, color: '#999', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  addressLabel: { fontSize: 14, color: ORANGE, fontWeight: '600' },
  addressSelected: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1 },
  addressDetail: { fontSize: 12, color: '#666', marginTop: 4, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  arrow: { fontSize: 16, color: '#999' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  deliveryLeft: { fontSize: 14, color: '#333' },
  deliveryRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deliveryTime: { fontSize: 14, color: '#07c160', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 20, paddingBottom: 270, paddingHorizontal: 16, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  modalCloseBtn: { position: 'absolute', right: 0, top: -4, padding: 8 },
  modalCloseText: { fontSize: 20, color: '#999', fontWeight: '300' },
  modalTwoCol: { flexDirection: 'row', flex: 1, minHeight: 260 },
  modalLeftCol: { width: 100, borderRightWidth: 1, borderRightColor: '#eee', paddingVertical: 8 },
  modalDayItem: { paddingVertical: 14, paddingHorizontal: 12, marginBottom: 4, borderRadius: 8 },
  modalDayItemActive: { backgroundColor: '#f5f5f5' },
  modalDayText: { fontSize: 14, color: '#666', textAlign: 'center' },
  modalDayTextActive: { fontSize: 14, color: ORANGE, fontWeight: '600', textAlign: 'center' },
  modalRightCol: { flex: 1, marginLeft: 12 },
  timePickerContent: { paddingVertical: 8, paddingBottom: 24 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 2 },
  timeRowActive: { backgroundColor: '#fff8f0' },
  timeRowLeft: { flex: 1 },
  timeRowMain: { fontSize: 15, color: '#333' },
  timeRowMainActive: { fontSize: 15, color: ORANGE, fontWeight: '600' },
  timeRowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  timeRowCheck: { fontSize: 16, color: ORANGE, fontWeight: '700', marginLeft: 8 },
  immediateBtn: { backgroundColor: '#f0f0f0', paddingVertical: 12, borderRadius: 10, marginBottom: 16 },
  immediateBtnText: { fontSize: 15, color: '#333', textAlign: 'center', fontWeight: '600' },
  modalLabel: { fontSize: 12, color: '#666', marginBottom: 10 },
  modalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalRowLabel: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 8 },
  dateChosen: { flexDirection: 'row', gap: 10 },
  dateOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f0f0f0' },
  dateOptionActive: { backgroundColor: ORANGE },
  dateOptionText: { fontSize: 14, color: '#666' },
  dateOptionTextActive: { color: '#fff', fontWeight: '600' },
  timePickerWrap: { height: 220, marginBottom: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8f8f8' },
  timePickerScroll: { flex: 1 },
  timePickerContent: { paddingVertical: 12 },
  timePickerItem: { height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginHorizontal: 8, marginVertical: 2 },
  timePickerItemActive: { backgroundColor: ORANGE },
  timePickerItemText: { fontSize: 16, color: '#333' },
  timePickerItemTextActive: { color: '#fff', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e8e8e8', alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: '#666', fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: ORANGE, alignItems: 'center' },
  modalConfirmFull: { paddingVertical: 12, borderRadius: 10, backgroundColor: ORANGE, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700', paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 12 },
  itemRow: { flexDirection: 'row', marginBottom: 14 },
  itemThumb: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', marginRight: 12 },
  itemImg: { width: '100%', height: '100%' },
  itemThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemThumbText: { fontSize: 12, color: '#999' },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 14, color: '#333', marginBottom: 4 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPrice: { fontSize: 14, color: '#333', fontWeight: '700' },
  itemQty: { fontSize: 12, color: '#999' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333' },
  summaryTotal: { fontSize: 16, fontWeight: '800', color: BTN_COLOR },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  payName: { fontSize: 15, color: '#333', fontWeight: '600' },
  radioWrap: { marginLeft: 12 },
  radioEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ddd' },
  radioChecked: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ffcc00', alignItems: 'center', justifyContent: 'center' },
  radioCheck: { fontSize: 12, color: '#ffffff', fontWeight: '800' },
  storeMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  storeInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  storeIcon: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  storeAddressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeAddress: { fontSize: 12, color: '#666', flexShrink: 1, marginRight: 8 },
  storeDistance: { fontSize: 12, color: '#666' },
  storeRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  storeRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  error: { marginTop: 8, color: '#f56c6c', fontWeight: '700', fontSize: 13 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12
  },
  payLaterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: '#e8e8e8',
    alignItems: 'center'
  },
  payLaterText: { fontSize: 16, color: '#666', fontWeight: '700' },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: BTN_COLOR,
    alignItems: 'center'
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
