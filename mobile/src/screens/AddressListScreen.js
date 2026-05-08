import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAddresses } from '../address/AddressContext';
import { useCart } from '../cart/CartContext';

const ORANGE = '#ff9500';
const RED = '#e53935';

export default function AddressListScreen({ navigation }) {
  const { addresses, selectedId, setSelectedId, setDefault, removeAddress, removeAddresses } = useAddresses();
  const { setAddress } = useCart();
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const onSelect = (addr) => {
    setSelectedId(addr.id);
    setAddress({
      name: addr.name,
      phone: addr.phone,
      detail: [addr.region, addr.street].filter(Boolean).join('\n')
    });
    navigation.goBack();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size >= addresses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(addresses.map((a) => a.id)));
    }
  };

  const onBulkDelete = () => {
    if (selectedIds.size === 0) return;
    Alert.alert('确认删除', '确定要删除所选地址吗？删除后无法恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '确定删除', style: 'destructive', onPress: () => {
        removeAddresses(Array.from(selectedIds));
        setSelectedIds(new Set());
        setManageMode(false);
      } }
    ]);
  };

  const onSingleDelete = (id) => {
    Alert.alert('确认删除', '确定要删除该地址吗？删除后无法恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '确定删除', style: 'destructive', onPress: () => removeAddress(id) }
    ]);
  };

  const onSetDefault = (id) => {
    setDefault(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>收货地址</Text>
        <View style={styles.headerRight}>
          {manageMode ? (
            <TouchableOpacity onPress={() => { setManageMode(false); setSelectedIds(new Set()); }}>
              <Text style={styles.exitManageBtn}>退出管理</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => setManageMode(true)}>
                <Text style={styles.manageBtn}>管理</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('AddressForm', { mode: 'add' })}>
                <Text style={styles.addBtn}>新增地址</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, manageMode && styles.scrollManage]}
        showsVerticalScrollIndicator={false}
      >
        {addresses.map((addr) =>
          manageMode ? (
            <View key={addr.id} style={styles.cardManage}>
              <TouchableOpacity
                style={styles.checkboxWrap}
                onPress={() => toggleSelect(addr.id)}
              >
                {selectedIds.has(addr.id) ? (
                  <View style={styles.checkboxChecked}>
                    <Text style={styles.checkboxCheck}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.checkboxEmpty} />
                )}
              </TouchableOpacity>
              <View style={styles.cardManageMain}>
                <View style={styles.topRow}>
                  <Text style={styles.region} numberOfLines={1}>{addr.region}</Text>
                  <TouchableOpacity
                    style={styles.editIconWrap}
                    onPress={() =>
                      navigation.navigate('AddressForm', {
                        id: addr.id,
                        region: addr.region,
                        street: addr.street,
                        name: addr.name,
                        phone: addr.phone,
                        isDefault: addr.isDefault
                      })
                    }
                  >
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.street}>{addr.street}</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{addr.name}</Text>
                  <Text style={styles.phone}> {addr.phone}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultTag}>
                      <Text style={styles.defaultText}>default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.defaultDeleteRow}>
                  <TouchableOpacity
                    style={styles.defaultRow}
                    onPress={() => onSetDefault(addr.id)}
                  >
                    <Text style={styles.defaultLabel}>默认</Text>
                    {addr.isDefault ? (
                      <View style={styles.defaultCheckWrap}>
                        <Text style={styles.defaultCheck}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.radioEmpty} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onSingleDelete(addr.id)}
                  >
                    <Text style={styles.deleteBtnText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              key={addr.id}
              style={styles.card}
              onPress={() => onSelect(addr)}
              activeOpacity={0.8}
            >
              <View style={styles.cardMain}>
                <Text style={styles.region}>{addr.region}</Text>
                <Text style={styles.street}>{addr.street}</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{addr.name}</Text>
                  <Text style={styles.phone}> {addr.phone}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultTag}>
                      <Text style={styles.defaultText}>default</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.radioWrap}>
                {selectedId === addr.id ? (
                  <View style={styles.radioChecked}>
                    <Text style={styles.radioCheck}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.radioEmpty} />
                )}
              </View>
            </TouchableOpacity>
          )
        )}
        <Text style={styles.endHint}>到底啦</Text>
      </ScrollView>

      {manageMode && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.selectAllRow} onPress={selectAll}>
            {selectedIds.size >= addresses.length && addresses.length > 0 ? (
              <View style={styles.checkboxChecked}>
                <Text style={styles.checkboxCheck}>✓</Text>
              </View>
            ) : (
              <View style={styles.checkboxEmpty} />
            )}
            <Text style={styles.selectAllText}>全选</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkDeleteBtn, selectedIds.size === 0 && styles.bulkDeleteBtnDisabled]}
            onPress={onBulkDelete}
            disabled={selectedIds.size === 0}
          >
            <Text style={styles.bulkDeleteText}>删除</Text>
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
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerBtn: { padding: 8 },
  headerBack: { fontSize: 28, color: '#333', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  manageBtn: { fontSize: 15, color: '#333', fontWeight: '600' },
  addBtn: { fontSize: 15, color: ORANGE, fontWeight: '700' },
  exitManageBtn: { fontSize: 15, color: '#333', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  scrollManage: { paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0'
  },
  cardMain: { flex: 1 },
  region: { fontSize: 15, color: '#333', fontWeight: '600', marginBottom: 4 },
  street: { fontSize: 14, color: '#666', marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontSize: 14, color: '#333' },
  phone: { fontSize: 14, color: '#666' },
  defaultTag: {
    marginLeft: 8,
    backgroundColor: ORANGE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  defaultText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  radioWrap: { marginLeft: 12 },
  radioEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc' },
  radioChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCheck: { fontSize: 12, color: '#fff', fontWeight: '800' },
  cardManage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0'
  },
  checkboxWrap: { marginRight: 12, marginTop: 2 },
  checkboxEmpty: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#ccc' },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxCheck: { fontSize: 12, color: '#fff', fontWeight: '800' },
  cardManageMain: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  region: { fontSize: 15, color: '#333', fontWeight: '600', flex: 1, marginRight: 8 },
  editIconWrap: { padding: 4 },
  editIcon: { fontSize: 16, color: '#666' },
  defaultRow: { flexDirection: 'row', alignItems: 'center' },
  defaultDeleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  defaultLabel: { fontSize: 13, color: '#666', marginRight: 6 },
  defaultCheckWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffcc00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  defaultCheck: { fontSize: 11, color: '#333', fontWeight: '800' },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  deleteBtnText: { fontSize: 14, color: '#666', fontWeight: '600' },
  endHint: { textAlign: 'center', color: '#999', fontSize: 13, marginTop: 24 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { fontSize: 15, color: '#333', fontWeight: '600' },
  bulkDeleteBtn: {
    backgroundColor: RED,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  bulkDeleteBtnDisabled: { backgroundColor: '#ccc', opacity: 0.8 },
  bulkDeleteText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});
