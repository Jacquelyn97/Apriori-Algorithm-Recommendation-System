import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';

// 注意：请把 mainLogin.png 和 wechat.png 放在 mobile/assets 目录下
// 与这里的路径保持一致：../assets/mainLogin.png 和 ../assets/wechat.png

export default function LoginScreen({ navigation }) {
  const onPressLogin = () => {
    // 登录后进入主 Tab
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../temp/loginImg.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.center}>
          <Text style={styles.title}>茶物语</Text>
          <Text style={styles.subtitle}>一杯茶，一段故事</Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={onPressLogin}>
            <Image source={require('../../assets/wechat.png')} style={styles.wechatIcon} />
            <Text style={styles.btnText}>一键登录</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  bg: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 75,
    color: 'rgb(20,73,21)',
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 21,
    color: 'rgb(20,73,21)'
  },
  bottom: {
    alignItems: 'center',
    marginBottom: 16
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 35,
    backgroundColor: 'rgb(81,157,108)', // 按照设计图
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  wechatIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: 'contain'
  },
  btnText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600'
  }
});

