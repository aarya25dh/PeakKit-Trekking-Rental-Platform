/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext({ items: [], toggleItem: () => {}, isSaved: () => false, removeItem: () => {}, clearWishlist: () => {} });
function readSaved() { try { return JSON.parse(localStorage.getItem("peakkit-wishlist") || "[]"); } catch { return []; } }
export function WishlistProvider({ children }) {
  const [items, setItems] = useState(readSaved);
  useEffect(() => localStorage.setItem("peakkit-wishlist", JSON.stringify(items)), [items]);
  const toggleItem = (item) => setItems((current) => current.some((saved) => saved.id === item.id) ? current.filter((saved) => saved.id !== item.id) : [...current, item]);
  return <WishlistContext.Provider value={{ items, toggleItem, isSaved: (id) => items.some((item) => item.id === id), removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)), clearWishlist: () => setItems([]) }}>{children}</WishlistContext.Provider>;
}
export const useWishlist = () => useContext(WishlistContext);
