import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

const ORANGE = '#ffcc00';

export default function ProfileScreen({ navigation }) {
  const username = '会员昵称';
  const cardNumber = 'A888 8888';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>会员卡</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 顶部会员信息卡 */}
        <View style={styles.memberCard}>
          <View style={styles.memberTopRow}>
            <View style={styles.memberUserRow}>
              <Image source={require('../../assets/user.png')} style={styles.avatar} />
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.username}>{username}</Text>
                  <Image source={require('../../assets/male.png')} style={styles.genderIcon} />
                </View>
                <Text style={styles.cardNo}>{cardNumber}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Image source={require('../../assets/qr-code.png')} style={styles.qrIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.memberBottomRow}>
            <Text style={styles.memberTag}>专享更多等级权益</Text>
            <TouchableOpacity>
              <Text style={styles.moreText}>了解详情 &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 会员卡横条 */}
        <View style={styles.vipStrip}>
          <View style={styles.vipLeft}>
            <Image source={require('../../assets/crown.png')} style={styles.vipIcon} />
            <View>
              <Text style={styles.vipTitle}>示例会员卡</Text>
              <Text style={styles.vipSubTitle}>开图即得一元示例权益</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.vipBtn}>
            <Text style={styles.vipBtnText}>开通</Text>
          </TouchableOpacity>
        </View>

        {/* 积分 / 卡券 / 优惠券 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Image source={require('../../assets/score.png')} style={styles.summaryIcon} />
            <Text style={styles.summaryNumber}>0</Text>
            <Text style={styles.summaryLabel}>积分</Text>
          </View>
          <View style={styles.summaryItem}>
            <Image source={require('../../assets/credit-card.png')} style={styles.summaryIcon} />
            <Text style={styles.summaryNumber}>0</Text>
            <Text style={styles.summaryLabel}>卡券</Text>
          </View>
          <View style={styles.summaryItem}>
            <Image source={require('../../assets/discount.png')} style={styles.summaryIcon} />
            <Text style={styles.summaryNumber}>0</Text>
            <Text style={styles.summaryLabel}>优惠券</Text>
          </View>
        </View>

        {/* 功能入口 */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Order' })}
          >
            <View style={styles.menuLeft}>
              <Image source={require('../../assets/p-myOrder.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>我的订单</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddressList')}
          >
            <View style={styles.menuLeft}>
              <Image source={require('../../assets/p-address.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>收货地址</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={styles.menuLeft}>
              <Image source={require('../../assets/p-cart.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>购物车</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8}>
            <View style={styles.menuLeft}>
              <Image source={require('../../assets/p-vipCard.png')} style={styles.menuIcon} />
              <Text style={styles.menuText}>我的会员卡</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#333', textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 24 },
  memberCard: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  memberUserRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  username: { fontSize: 16, color: '#fff', fontWeight: '700', marginRight: 6 },
  genderIcon: { width: 18, height: 18 },
  cardNo: { fontSize: 13, color: '#f5f5f5' },
  qrIcon: { width: 28, height: 28, tintColor: '#fff' },
  memberBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  memberTag: { fontSize: 12, color: '#f5f5f5' },
  moreText: { fontSize: 12, color: ORANGE, fontWeight: '700' },
  vipStrip: {
    backgroundColor: '#002b40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  vipLeft: { flexDirection: 'row', alignItems: 'center' },
  vipIcon: { width: 28, height: 28, marginRight: 10 },
  vipTitle: { fontSize: 14, color: '#fff', fontWeight: '700' },
  vipSubTitle: { fontSize: 11, color: '#e0f0ff', marginTop: 2 },
  vipBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  vipBtnText: { fontSize: 13, color: '#333', fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12
  },
  summaryItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryIcon: { width: 20, height: 20, marginBottom: 4 },
  summaryNumber: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 2 },
  summaryLabel: { fontSize: 12, color: '#666' },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee'
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 22, height: 22, marginRight: 10 },
  menuText: { fontSize: 14, color: '#333' },
  menuArrow: { fontSize: 18, color: '#999' }
});

