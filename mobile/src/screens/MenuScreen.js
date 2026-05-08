import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { useCart } from '../cart/CartContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MenuScreen({ navigation }) {
  const { setDeliveryMode } = useCart();
  // 跑马灯动画
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    const loop = () => {
      translateX.setValue(SCREEN_WIDTH);
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true
      }).start(() => loop());
    };
    loop();
  }, [translateX]);

  return (
    <View style={styles.container}>
      {/* 下半部分可滚动内容 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部背景：铺满屏宽，不受框限制 */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerBgOuter}>
            <ImageBackground
              source={require('../../temp/programBackground.jpg')}
              style={styles.headerBg}
              resizeMode="cover"
            >
              {/* 留白显示背景图 */}
            </ImageBackground>
          </View>

          {/* 茶杯 / 外卖两个按钮区 - 在背景图尾端 */}
          <View style={styles.pickRow}>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => {
                setDeliveryMode('self');
                navigation.navigate('DrinkMenu');
              }}
            >
              <Image
                source={require('../../assets/tea_cup.png')}
                style={styles.pickIcon}
              />
              <Text style={styles.pickText}>门店自取</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => {
                setDeliveryMode('delivery');
                navigation.navigate('DrinkMenu');
              }}
            >
              <Image
                source={require('../../assets/take_away.png')}
                style={styles.pickIcon}
              />
              <Text style={styles.pickText}>外卖点单</Text>
            </TouchableOpacity>
          </View>

          {/* 喇叭通知条：动态文字 */}
          <View style={styles.noticeBar}>
            <Image
              source={require('../../assets/speaker.png')}
              style={styles.speaker}
            />
            <View style={styles.noticeClip}>
              <Animated.Text
              numberOfLines={1}
              ellipsizeMode="clip"
                style={[
                  styles.noticeText,
                  { transform: [{ translateX }] }
                ]}
              >
                本店新品上线，草莓芝士奶盖、芝士奶盖抹茶、火龙果椰香奶茶限时优惠，欢迎品尝～
              </Animated.Text>
            </View>
          </View>
        </View>

      
        {/* 奶茶团购 / 积分兑换 / 互动抽奖 */}
        <View style={styles.featureRow}>
          <View style={[styles.featureCard, { backgroundColor: 'rgb(230,235,222)' }]}>
            <Text style={styles.featureText}>奶茶团购</Text>
            <Image
              source={require('../../assets/group_buying.png')}
              style={styles.featureIcon}
            />
          </View>
          <View style={[styles.featureCard, { backgroundColor: 'rgb(248,240,220)' }]}>
            <Text style={styles.featureText}>积分兑换</Text>
            <Image
              source={require('../../assets/point_redemption.png')}
              style={styles.featureIcon}
            />
          </View>
          <View style={[styles.featureCard, { backgroundColor: 'rgb(247,231,222)' }]}>
            <Text style={styles.featureText}>互动抽奖</Text>
            <Image
              source={require('../../assets/lucky_draw.png')}
              style={styles.featureIcon}
            />
          </View>
        </View>

        {/* 新品卡片区 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>新品上市</Text>

          {/* 草莓芝士奶盖：尽量展示头部 */}
          <View style={styles.card}>
            <View style={styles.cardImgWrapper}>
              <Image
                source={require('../../temp/strawberry_milk.jpg')}
                style={styles.cardImgTop}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTag}>热卖</Text>
              <Text style={styles.cardName}>草莓芝士奶盖</Text>
              <Text style={styles.cardPrice}>14元</Text>
              <TouchableOpacity
                style={styles.cardBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProductDetail', { product: { id: 8 } })}
              >
                <Text style={styles.cardBtnText}>立即下单 &gt;</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 芝士奶盖抹茶：尽量展示头部 */}
          <View style={styles.card}>
            <View style={styles.cardImgWrapper}>
              <Image
                source={require('../../temp/cheese_milk.jpg')}
                style={styles.cardImgTop}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTag}>热卖</Text>
              <Text style={styles.cardName}>芝士奶盖抹茶</Text>
              <Text style={styles.cardPrice}>14元</Text>
              <TouchableOpacity
                style={styles.cardBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProductDetail', { product: { id: 2 } })}
              >
                <Text style={styles.cardBtnText}>立即下单 &gt;</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 火龙果椰香奶茶：尽量展示头部 */}
          <View style={styles.card}>
            <View style={styles.cardImgWrapper}>
              <Image
                source={require('../../temp/dragon_milk.jpg')}
                style={styles.cardImgTop}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTag}>热卖</Text>
              <Text style={styles.cardName}>火龙果椰香奶茶</Text>
              <Text style={styles.cardPrice}>14元</Text>
              <TouchableOpacity
                style={styles.cardBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProductDetail', { product: { id: 13 } })}
              >
                <Text style={styles.cardBtnText}>立即下单 &gt;</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const RADIUS = 20;

const styles = StyleSheet.create({
  // 1. 整体背景色
  container: {
    flex: 1,
    backgroundColor: 'rgb(179, 198, 170)'
  },
  headerWrapper: {
    paddingHorizontal: 12,
    paddingTop: 0
  },
  // programBackground 放在框外：全屏宽、无圆角，不受内边距限制
  headerBgOuter: {
    width: SCREEN_WIDTH,
    marginLeft: -12,
    marginRight: -12
  },
  headerBg: {
    width: '100%',
    height: 250
  },

  // 3. 茶杯 / 外卖两个按钮框
  pickRow: {
    flexDirection: 'row',
    marginTop: -20, // 向上叠在背景尾端
    paddingHorizontal: 24,
    justifyContent: 'space-between'
  },
  pickBtn: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS,
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3
  },
  pickIcon: {
    width: 50,
    height: 50,
    marginBottom: 12,
    resizeMode: 'contain'
  },
  pickText: {
    fontSize: 18,
    color: '#333'
  },

  // 4. 喇叭动态文字条
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginHorizontal: 20,
    borderRadius: RADIUS,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  speaker: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: 6
  },
  noticeClip: {
    overflow: 'hidden',
    flex: 1
  },
  noticeText: {
    fontSize: 12,
    color: '#555',
    width: SCREEN_WIDTH * 2
  },

  // 滚动内容
  scroll: {
    flex: 1,
    marginTop: 16
  },

  // 5. 三个功能卡片，背景色按要求
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24, // 距离上一个元素 24
    paddingHorizontal: 12
  },
  featureCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: RADIUS,
    alignItems: 'center',
    paddingVertical: 24
  },
  featureText: {
    fontSize: 18,
    color: '#444',
    marginBottom: 6
  },
  featureIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain'
  },

  section: {
    marginTop: 16,
    paddingHorizontal: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4
  },

  // 6. 新品图片尽量展示头部：用裁切容器只显示上半部分
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 12
  },
  cardImgWrapper: {
    width: 130,
    height: 110,
    overflow: 'hidden'
  },
  cardImgTop: {
    width: '100%',
    height: 130,          // 比容器高一点，只显示上半部分，相当于“头部”
    transform: [{ translateY: -10 }]
  },
  cardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between'
  },
  cardTag: {
    fontSize: 13,
    color: '#ff6a00',
    marginBottom: 4
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4
  },
  cardPrice: {
    fontSize: 14,
    color: '#e91e63',
    fontWeight: '700'
  },
  cardBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e91e63',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  cardBtnText: {
    fontSize: 12,
    color: '#e91e63'
  }
});