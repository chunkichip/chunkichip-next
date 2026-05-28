import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  cartId: string;
  productId: string;
  variationId: string | null;
  name: string;
  priceAmount: number;
  price: string;
  imageUrl: string | null;
  quantity: number;
  isBox: boolean;
  boxSize: string | null;
  selectedFlavors?: {
    id: string;
    name: string;
    imageUrl: string | null;
  }[];
};

type CartStore = {
  items: CartItem[];

  addItem: (
    item: Omit<CartItem, 'cartId' | 'quantity'>
  ) => void;

  removeItem: (cartId: string) => void;

  increaseQuantity: (cartId: string) => void;

  decreaseQuantity: (cartId: string) => void;

  clearCart: () => void;

  totalItems: () => number;

  totalAmount: () => number;
};

export const useCartStore =
  create<CartStore>()(
    persist(
      (set, get) => ({
        items: [],

        addItem: (item) => {
          const existing =
            get().items.find(
              (i) =>
                i.productId === item.productId &&
                JSON.stringify(
                  i.selectedFlavors || []
                ) ===
                  JSON.stringify(
                    item.selectedFlavors || []
                  )
            );

          if (existing) {
            set({
              items: get().items.map((i) =>
                i.cartId === existing.cartId
                  ? {
                      ...i,
                      quantity:
                        i.quantity + 1,
                    }
                  : i
              ),
            });

            return;
          }

          const cartId = `${item.productId}-${Date.now()}`;

          set({
            items: [
              ...get().items,
              {
                ...item,
                cartId,
                quantity: 1,
              },
            ],
          });
        },

        removeItem: (cartId) => {
          set({
            items: get().items.filter(
              (item) =>
                item.cartId !== cartId
            ),
          });
        },

        increaseQuantity: (cartId) => {
          set({
            items: get().items.map((item) =>
              item.cartId === cartId
                ? {
                    ...item,
                    quantity:
                      item.quantity + 1,
                  }
                : item
            ),
          });
        },

        decreaseQuantity: (cartId) => {
          const item = get().items.find(
            (i) => i.cartId === cartId
          );

          if (!item) return;

          if (item.quantity <= 1) {
            set({
              items: get().items.filter(
                (i) =>
                  i.cartId !== cartId
              ),
            });

            return;
          }

          set({
            items: get().items.map((i) =>
              i.cartId === cartId
                ? {
                    ...i,
                    quantity:
                      i.quantity - 1,
                  }
                : i
            ),
          });
        },

        clearCart: () => {
          set({ items: [] });
        },

        totalItems: () => {
          return get().items.reduce(
            (sum, item) =>
              sum + item.quantity,
            0
          );
        },

        totalAmount: () => {
          return get().items.reduce(
            (sum, item) =>
              sum +
              item.priceAmount *
                item.quantity,
            0
          );
        },
      }),
      {
        name: 'chunkichip-cart',
      }
    )
  );