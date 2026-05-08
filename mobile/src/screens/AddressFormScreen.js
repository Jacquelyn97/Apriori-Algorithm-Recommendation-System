import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAddresses } from '../address/AddressContext';

const ORANGE = '#ff9500';

export default function AddressFormScreen({ navigation, route }) {
  const { addAddress, updateAddress } = useAddresses();
  const isEdit = route.params?.id != null;
  const [region, setRegion] = useState(route.params?.region ?? '');
  const [street, setStreet] = useState(route.params?.street ?? '');
  const [name, setName] = useState(route.params?.name ?? '');
  const [phone, setPhone] = useState(route.params?.phone ?? '');
  const [isDefault, setIsDefault] = useState(route.params?.isDefault ?? false);

  const save = () => {
    if (!name.trim() || !phone.trim()) return;
    if (isEdit) {
      updateAddress(route.params.id, {
        region: region.trim(),
        street: street.trim(),
        name: name.trim(),
        phone: phone.trim(),
        isDefault
      });
    } else {
      addAddress({
        region: region.trim(),
        street: street.trim(),
        name: name.trim(),
        phone: phone.trim(),
        isDefault
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '编辑地址' : '新增地址'}</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>省/州/区</Text>
        <TextInput
          style={styles.input}
          placeholder="例如 Malaysia Selangor Seri Kembangan"
          value={region}
          onChangeText={setRegion}
        />
        <Text style={styles.label}>街道门牌</Text>
        <TextInput
          style={styles.input}
          placeholder="例如 2 Jalan Bunga 1/5 Taman Bunga Raya"
          value={street}
          onChangeText={setStreet}
        />
        <Text style={styles.label}>收货人</Text>
        <TextInput style={styles.input} placeholder="姓名" value={name} onChangeText={setName} />
        <Text style={styles.label}>手机号</Text>
        <TextInput
          style={styles.input}
          placeholder="手机号"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <View style={styles.row}>
          <Text style={styles.label}>设为默认地址</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ false: '#ddd', true: ORANGE }} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>保存</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerBack: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  placeholder: { width: 44 },
  scroll: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  btn: {
    marginTop: 24,
    backgroundColor: ORANGE,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center'
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
