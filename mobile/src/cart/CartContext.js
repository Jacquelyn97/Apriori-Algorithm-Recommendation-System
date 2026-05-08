import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

function normalizeItem(item) {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    image: item.image || null,
    qty: Number(item.qty || 0)
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState('self'); // self | delivery
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    detail: ''
  });

  const setQty = useCallback((item, qty) => {
    const it = normalizeItem({ ...item, qty });
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === it.id);
      if (qty <= 0) {
        if (idx < 0) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      }
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = it;
        return next;
      }
      return [...prev, it];
    });
  }, []);

  const inc = useCallback((item, delta = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      const next = [...prev];
      if (idx >= 0) {
        const qty = (next[idx].qty || 0) + delta;
        if (qty <= 0) next.splice(idx, 1);
        else next[idx] = normalizeItem({ ...next[idx], qty });
        return next;
      }
      if (delta > 0) return [...prev, normalizeItem({ ...item, qty: delta })];
      return prev;
    });
  }, []);

  const remove = useCallback((id) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const totalQty = useMemo(() => cart.reduce((s, x) => s + (x.qty || 0), 0), [cart]);
  const totalPrice = useMemo(
    () => cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 0), 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      setQty,
      inc,
      remove,
      clear,
      totalQty,
      totalPrice,
      deliveryMode,
      setDeliveryMode,
      address,
      setAddress
    }),
    [cart, setQty, inc, remove, clear, totalQty, totalPrice, deliveryMode, address]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

