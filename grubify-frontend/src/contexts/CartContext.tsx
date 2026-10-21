import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart } from '../types';
import { cartService } from '../services/api';

const USER_ID = 'user123';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addItem: (foodItemId: number, quantity: number, specialInstructions: string) => Promise<Cart>;
  updateItem: (itemId: number, quantity: number, specialInstructions: string) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await cartService.get(USER_ID);
      setCart(cartData);
      setError(null);
    } catch (err) {
      setError('Failed to load cart.');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (foodItemId: number, quantity: number, specialInstructions: string): Promise<Cart> => {
    const updatedCart = await cartService.addItem(USER_ID, { foodItemId, quantity, specialInstructions });
    setCart(updatedCart);
    return updatedCart;
  };

  const updateItem = async (itemId: number, quantity: number, specialInstructions: string) => {
    const updatedCart = await cartService.updateItem(USER_ID, itemId, { quantity, specialInstructions });
    setCart(updatedCart);
  };

  const removeItem = async (itemId: number) => {
    const updatedCart = await cartService.removeItem(USER_ID, itemId);
    setCart(updatedCart);
  };

  const clearCart = async () => {
    await cartService.clear(USER_ID);
    setCart(cart ? { ...cart, items: [] } : null);
  };

  return (
    <CartContext.Provider value={{ cart, loading, error, itemCount, refreshCart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
