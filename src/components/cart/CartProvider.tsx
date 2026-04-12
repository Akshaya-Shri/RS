"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
  id: string; // unique combo of slug and size
  name: string;
  size: string;
  price: number;
  image: string;
  qty: number;
  slug: string;
  product_id?: number;
};

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('revathi-cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        } else {
          console.warn("Invalid cart data in localStorage, resetting.");
          setCartItems([]);
          localStorage.removeItem('revathi-cart');
        }
      } catch (e) {
        console.error("Could not parse cart from localStorage");
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('revathi-cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addItem = (newItem: CartItem) => {
    setCartItems(items => {
      const existingIndex = items.findIndex(i => i.id === newItem.id);
      if (existingIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingIndex].qty += newItem.qty;
        return updatedItems;
      }
      return [...items, newItem];
    });
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(items => items.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const subtotal = safeItems.reduce((total, item) => total + (item.price * item.qty), 0);
  const shipping = safeItems.length > 0 ? 50 : 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{ cartItems, addItem, removeItem, updateQuantity, clearCart, subtotal, shipping, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
