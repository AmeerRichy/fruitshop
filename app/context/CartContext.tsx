"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { CartLine } from "../types/product";

const fallbackImage = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80";
const withSafeImage = (item: CartLine): CartLine => ({ ...item, image: typeof item.image === "string" && item.image.trim() ? item.image : fallbackImage });

// Type for cart item
export type CartItem = CartLine;

// Type for context
type CartContextType = {
  cart: CartItem[];
  cartCount: number;
  total: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// CartProvider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem("fruit-cart");
    if (storedCart) { try { const parsed = JSON.parse(storedCart); setCart(Array.isArray(parsed) ? parsed.map(withSafeImage) : []); } catch { localStorage.removeItem("fruit-cart"); } }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("fruit-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    const safeItem = withSafeImage(item);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === safeItem.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === safeItem.productId ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + safeItem.quantity) } : i
        );
      }
      return [...prev, safeItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== id));
  };
  const updateQuantity = (id: string, quantity: number) => setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: Math.max(i.minQuantity, Math.min(i.maxQuantity, quantity)) } : i));

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// ✅ Custom hook to use the cart
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
