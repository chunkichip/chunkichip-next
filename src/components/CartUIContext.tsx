'use client';
import { createContext, useContext } from 'react';

export type CartUIActions = { openCart: (resetBuilder?: () => void) => void };
export const CartUIContext = createContext<CartUIActions | null>(null);

export function useCartUI() {
  const actions = useContext(CartUIContext);
  if (!actions) throw new Error('Cart controls must be used within SiteShell.');
  return actions;
}
