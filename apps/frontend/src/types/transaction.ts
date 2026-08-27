import { PriceType } from './product';

export type PaymentStatus = 'PAID' | 'DP' | 'UNPAID';
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';
export type OrderStatus = 'ANTRIAN' | 'PROSES' | 'SELESAI' | 'DIAMBIL';

export interface CartItemAddon {
  addon_id?: number;
  addon_name: string;
  price: number;
  qty: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  product_variant_id?: number | null;
  variant_name?: string | null;
  price_type: PriceType;
  unit_price: number;
  qty: number;
  min_order: number;
  unit_name: string;
  addons: CartItemAddon[];
  subtotal: number;
}

export interface CreateTransactionPayload {
  customer_id?: number | null;
  customer_name?: string;
  discount_amount?: number;
  pay_amount: number;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  estimated_done_at?: string; // YYYY-MM-DD
  items: {
    product_id: number;
    product_variant_id?: number;
    custom_price?: number;
    qty: number;
    addons?: {
      addon_id?: number;
      addon_name?: string;
      price?: number;
      qty?: number;
    }[];
  }[];
}
