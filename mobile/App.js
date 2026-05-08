import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MenuScreen from './src/screens/MenuScreen';
import DrinkMenuScreen from './src/screens/DrinkMenuScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import AddressListScreen from './src/screens/AddressListScreen';
import AddressFormScreen from './src/screens/AddressFormScreen';
import LoginScreen from './src/screens/LoginScreen';
import { CartProvider } from './src/cart/CartContext';
import { OrderProvider } from './src/order/OrderContext';
import { AddressProvider } from './src/address/AddressContext';
// CommentScreen 已被合并到 DrinkMenuScreen 的内部分页中，无需单独路由

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, size }) => {
          let source;
          if (route.name === 'Home') {
            source = focused
              ? require('./assets/home_clicked.png')
              : require('./assets/home.png');
          } else if (route.name === 'DrinkMenu') {
            source = focused
              ? require('./assets/menu_clicked.png')
              : require('./assets/menu.png');
          } else if (route.name === 'Order') {
            source = focused
              ? require('./assets/order_clicked.png')
              : require('./assets/order.png');
          } else if (route.name === 'Profile') {
            source = focused
              ? require('./assets/profile_clicked.png')
              : require('./assets/profile.png');
          }
          return (
            <Image
              source={source}
              style={{ width: size, height: size, resizeMode: 'contain' }}
            />
          );
        }
      })}
    >
      {/* 1. 主页：首页（设计图中的 index） */}
      <Tab.Screen name="Home" component={MenuScreen} options={{ title: '主页' }} />
      {/* 2. 点餐页：饮品列表 */}
      <Tab.Screen name="DrinkMenu" component={DrinkMenuScreen} options={{ title: '点餐' }} />
      {/* 3. 订单页：订单历史 */}
      <Tab.Screen name="Order" component={OrdersScreen} options={{ title: '订单' }} />
      {/* 4. 我的 */}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <CartProvider>
      <OrderProvider>
        <AddressProvider>
          <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ title: '商品详情' }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
            options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddressList"
              component={AddressListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddressForm"
              component={AddressFormScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        </AddressProvider>
      </OrderProvider>
    </CartProvider>
  );
}

