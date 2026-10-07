/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cartAPI } from "../services/api";

const CartContext = createContext(null);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("peakkit-cart") || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const [pickupDate, setPickupDate] = useState(() => localStorage.getItem("peakkit-pickup-date") || "");
  const [returnDate, setReturnDate] = useState(() => localStorage.getItem("peakkit-return-date") || "");

  useEffect(() => {
    localStorage.setItem("peakkit-cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("peakkit-pickup-date", pickupDate);
  }, [pickupDate]);

  useEffect(() => {
    localStorage.setItem("peakkit-return-date", returnDate);
  }, [returnDate]);

  // Compute dynamic rental days from pickup and return dates
  const computedDays = useMemo(() => {
    if (pickupDate && returnDate) {
      const p = new Date(pickupDate);
      const r = new Date(returnDate);
      const diff = Math.round((r - p) / (1000 * 60 * 60 * 24));
      if (diff >= 1 && diff <= 30) return diff;
    }
    return null;
  }, [pickupDate, returnDate]);

  // Auto-sync item duration when dates change
  useEffect(() => {
    if (computedDays && computedDays >= 1) {
      setItems((current) =>
        current.map((item) => ({ ...item, duration: computedDays }))
      );
      // Asynchronously trigger backend recalculation for items
      items.forEach((item) => {
        cartAPI
          .updateItem(item.id, {
            rental_start_date: pickupDate,
            rental_end_date: returnDate,
            daily_rental_price: item.rentalPrice,
            quantity: item.quantity || 1,
          })
          .catch(() => {});
      });
    }
  }, [computedDays, pickupDate, returnDate]);

  const addItem = (item) => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      try {
        window.fbq("track", "AddToCart", {
          content_name: item.name,
          content_ids: [item.id || item.gear_id],
          content_type: "product",
          value: Number(item.rentalPrice || item.price_per_day || 500),
          currency: "NPR",
        });
      } catch (err) {
        console.debug("Meta Pixel AddToCart error:", err);
      }
    }

    setItems((current) => {
      const found = current.find((entry) => entry.id === item.id);
      const itemDuration = computedDays || item.duration || 7;
      return found
        ? current.map((entry) =>
            entry.id === item.id
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry
          )
        : [...current, { ...item, quantity: 1, duration: itemDuration }];
    });
  };

  const updateQuantity = (id, delta) =>
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );

  const updateDuration = (id, duration) =>
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, duration: Number(duration) } : item
      )
    );

  const removeItem = (id) =>
    setItems((current) => current.filter((item) => item.id !== id));

  const totals = useMemo(() => {
    const rentalSubtotal = items.reduce(
      (sum, item) =>
        sum +
        (item.rentalPrice || 500) *
          (computedDays || item.duration || 7) *
          (item.quantity || 1),
      0
    );
    const deposits = Math.round(rentalSubtotal * 0.6);
    return {
      rentalSubtotal,
      deposits,
      deliveryFee: 0,
      grandTotal: rentalSubtotal + deposits,
      durationDays: computedDays || (items[0]?.duration) || 7,
    };
  }, [items, computedDays]);

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
        computedDays,
        ...totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

