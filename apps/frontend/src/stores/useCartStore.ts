import { create } from 'zustand';
import { CartItem } from '../types/transaction';

interface CartState {
  items: CartItem[];
  customerName: string;
  customerId: number | null;
  discountAmount: number;
  payAmount: number;
  estimatedDoneAt: string;
  setCustomer: (id: number | null, name: string) => void;
  setDiscount: (amount: number) => void;
  setPayAmount: (amount: number) => void;
  setEstimatedDate: (date: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateItemQty: (index: number, qty: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getRemaining: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: 'Umum',
  customerId: null,
  discountAmount: 0,
  payAmount: 0,
  estimatedDoneAt: '',

  setCustomer: (customerId, customerName) => set({ customerId, customerName }),
  setDiscount: (discountAmount) => set({ discountAmount }),
  setPayAmount: (payAmount) => set({ payAmount }),
  setEstimatedDate: (estimatedDoneAt) => set({ estimatedDoneAt }),

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) => set((state) => ({ items: state.items.filter((_, i) => i !== index) })),
  updateItemQty: (index, qty) =>
    set((state) => {
      const next = [...state.items];
      if (next[index]) {
        next[index].qty = qty;
        const addonsTotal = next[index].addons.reduce((acc, a) => acc + a.price * a.qty, 0);
        next[index].subtotal = (next[index].unit_price + addonsTotal) * qty;
      }
      return { items: next };
    }),
  clearCart: () => set({ items: [], discountAmount: 0, payAmount: 0, customerName: 'Umum', customerId: null }),

  getSubtotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
  getTotal: () => Math.max(0, get().getSubtotal() - get().discountAmount),
  getRemaining: () => Math.max(0, get().getTotal() - get().payAmount),
}));
