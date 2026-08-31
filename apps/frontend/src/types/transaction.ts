import { PriceType } from './product';

export type PaymentStatus = 'PAID' | 'DP' | 'UNPAID';
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';
export type OrderStatus = 'ANTRIAN' | 'PROSES' | 'SELESAI' | 'DIAMBIL' | 'BATAL';

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
  idempotency_key?: string;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  estimated_done_at?: string; // YYYY-MM-DD
  items: {
    product_id: number;
    product_variant_id?: number;
    custom_price?: number;
    qty: number;
    length?: number;
    width?: number;
    addons?: {
      addon_id?: number;
      addon_name?: string;
      price?: number;
      qty?: number;
    }[];
    materials?: {
      raw_material_id: number;
      material_qty: number;
    }[];
  }[];
}

// === Server-side display types for transaction detail ===

/** A single entry from the `payments` table. */
export interface PaymentEntry {
  id: number;
  transaction_id: number;
  payment_type: 'PAYMENT' | 'REFUND';
  amount: number;
  payment_method: PaymentMethod;
  reference_no?: string | null;
  notes?: string | null;
  created_by?: number | null;
  created_at: string;
}

/** A single production event from the `production_events` table. */
export interface ProductionEvent {
  id: number;
  transaction_id: number;
  event_type: string;
  notes?: string | null;
  actor_id?: number | null;
  created_at: string;
}

/** A material snapshot from `transaction_item_materials`. */
export interface TransactionItemMaterial {
  id: number;
  transaction_item_id: number;
  raw_material_id: number;
  material_name: string;
  unit: string;
  required_qty: number;
  reserved_qty: number;
  consumed_qty: number;
  waste_qty: number;
  source_type: string;
  consumption_basis: string;
  addon_id?: number | null;
}

/** Extended transaction detail returned from GET /api/v1/transactions/:id */
export interface TransactionDetail {
  id: number;
  invoice_number: string;
  customer_id?: number | null;
  customer_name?: string | null;
  cashier_name?: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  pay_amount: number;
  paid_amount: number;
  change_amount: number;
  settlement_payment_method?: PaymentMethod | null;
  settlement_pay_amount?: number | null;
  estimated_done_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: TransactionDetailItem[];
  payments?: PaymentEntry[];
  production_events?: ProductionEvent[];
}

export interface TransactionDetailItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_name?: string | null;
  price_type: PriceType;
  unit_price: number;
  qty: number;
  length?: number | null;
  width?: number | null;
  subtotal: number;
  unit_name?: string | null;
  addons?: CartItemAddon[];
  materials?: TransactionItemMaterial[];
}
