/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
function readCart() { try { return JSON.parse(localStorage.getItem("peakkit-cart") || "[]"); } catch { return []; } }
export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart); const [pickupDate, setPickupDate] = useState(() => localStorage.getItem("peakkit-pickup-date") || ""); const [returnDate, setReturnDate] = useState(() => localStorage.getItem("peakkit-return-date") || "");
  useEffect(() => localStorage.setItem("peakkit-cart", JSON.stringify(items)), [items]); useEffect(() => localStorage.setItem("peakkit-pickup-date", pickupDate), [pickupDate]); useEffect(() => localStorage.setItem("peakkit-return-date", returnDate), [returnDate]);
  const addItem = (item) => setItems((current) => { const found = current.find((entry) => entry.id === item.id); return found ? current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, quantity: 1, duration: item.duration || 7 }]; });
  const updateQuantity = (id, delta) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const updateDuration = (id, duration) => setItems((current) => current.map((item) => item.id === id ? { ...item, duration: Number(duration) } : item));
  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const totals = useMemo(() => {
    const rentalSubtotal = items.reduce(
      (sum, item) => sum + (item.rentalPrice || 500) * (item.duration || 7) * (item.quantity || 1),
      0
    );
    const deposits = Math.round(rentalSubtotal * 0.6);
    return { rentalSubtotal, deposits, deliveryFee: 0, grandTotal: rentalSubtotal + deposits };
  }, [items]);
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateDuration,
        removeItem,
        clearCart: () => setItems([]),
        pickupDate,
        returnDate,
        setPickupDate,
        setReturnDate,
        ...totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
