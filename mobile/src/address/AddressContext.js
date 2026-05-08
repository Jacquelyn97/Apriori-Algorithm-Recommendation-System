import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AddressContext = createContext(null);

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState([
    {
      id: 'addr1',
      region: 'Malaysia Selangor Seri Kembangan',
      street: '2 Jalan Bunga 1/5 Taman Bunga Raya',
      name: 'Jacquelyn',
      phone: '125248864',
      isDefault: true
    },
    {
      id: 'addr2',
      region: 'Malaysia Selangor Petaling Jaya',
      street: '6 Jalan SK 2/9 Taman Indah Damansara',
      name: 'ChaiYing',
      phone: '185426518',
      isDefault: false
    }
  ]);
  const [selectedId, setSelectedIdState] = useState('addr1');

  const addAddress = useCallback((addr) => {
    const id = 'addr' + Date.now();
    const newAddr = { ...addr, id, isDefault: addr.isDefault ?? false };
    setAddresses((prev) => {
      if (newAddr.isDefault) {
        return prev.map((a) => ({ ...a, isDefault: false })).concat([newAddr]);
      }
      return [...prev, newAddr];
    });
    return id;
  }, []);

  const updateAddress = useCallback((id, updates) => {
    setAddresses((prev) => {
      const next = prev.map((a) => {
        if (a.id !== id) return a;
        const merged = { ...a, ...updates };
        return merged;
      });
      if (updates.isDefault) {
        return next.map((a) => ({ ...a, isDefault: a.id === id }));
      }
      return next;
    });
  }, []);

  const removeAddress = useCallback((id) => {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      const removed = prev.find((a) => a.id === id);
      if (removed?.isDefault && next.length > 0 && !next.some((a) => a.isDefault)) {
        return next.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
      }
      return next;
    });
    setSelectedIdState((sid) => (sid === id ? null : sid));
  }, []);

  const removeAddresses = useCallback((ids) => {
    if (!ids || ids.length === 0) return;
    setAddresses((prev) => {
      const idSet = new Set(ids);
      let next = prev.filter((a) => !idSet.has(a.id));
      const removedDefault = prev.some((a) => idSet.has(a.id) && a.isDefault);
      const hasDefault = next.some((a) => a.isDefault);
      if (removedDefault && next.length > 0 && !hasDefault) {
        next = next.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
      }
      return next;
    });
    setSelectedIdState((sid) => (sid && ids.includes(sid) ? null : sid));
  }, []);

  const setDefault = useCallback((id) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const setSelectedId = useCallback((id) => {
    setSelectedIdState(id);
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedId) ?? addresses.find((a) => a.isDefault) ?? addresses[0],
    [addresses, selectedId]
  );

  const value = useMemo(
    () => ({
      addresses,
      selectedId,
      selectedAddress,
      addAddress,
      updateAddress,
      removeAddress,
      removeAddresses,
      setDefault,
      setSelectedId
    }),
    [addresses, selectedId, selectedAddress, addAddress, updateAddress, removeAddress, removeAddresses, setDefault, setSelectedId]
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddresses must be used within AddressProvider');
  return ctx;
}
