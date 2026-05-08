import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const nextCustomerNumRef = useRef(1);

  const createOrder = useCallback((payload) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const n = nextCustomerNumRef.current;
    nextCustomerNumRef.current += 1;
    const id = `ORD${y}${m}${d}${h}${min}E${String(n).padStart(3, '0')}`;
    const order = {
      id,
      createTime: now.toISOString(),
      status: payload.status ?? '待支付',
      ...payload
    };
    setOrders((prev) => [order, ...prev]);
    return id;
  }, []);

  const updateStatus = useCallback((id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const value = useMemo(() => ({ orders, createOrder, updateStatus }), [orders, createOrder, updateStatus]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}

