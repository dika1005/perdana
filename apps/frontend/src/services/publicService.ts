import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

/**
 * Client publik tanpa credential/cookie untuk endpoint yang tidak memerlukan auth.
 */
const publicClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  // Tidak pakai withCredentials karena endpoint publik tidak butuh cookie JWT
});

export interface PublicStoreInfo {
  name: string;
  address: string;
  phone: string;
}

export interface PublicCategory {
  id: number;
  name: string;
}

export interface PublicProduct {
  id: number;
  category_id: number | null;
  name: string;
  price_type: string;
  default_price: number;
  min_price: number;
  max_price: number;
  min_order: number;
  unit_name: string;
  has_variants: boolean;
  variants?: {
    id: number;
    product_id: number;
    variant_name: string;
    price_type: string;
    price: number;
    min_price: number;
    max_price: number;
  }[];
}

export interface PublicCatalog {
  store: PublicStoreInfo;
  categories: PublicCategory[];
  products: PublicProduct[];
}

export interface PublicTrackingItem {
  product_name: string;
  variant_name?: string | null;
  qty: number;
  addons: string[];
}

export interface PublicTrackingData {
  invoice_number: string;
  customer_name: string;
  order_status: 'ANTRIAN' | 'PROSES' | 'SELESAI' | 'DIAMBIL';
  payment_status: 'PAID' | 'DP' | 'UNPAID';
  total_amount: number | string;
  pay_amount: number | string;
  remaining_amount: number | string;
  estimated_done_at?: string | null;
  created_at: string;
  items: PublicTrackingItem[];
  store_name: string;
  store_phone: string;
}

export const publicService = {
  getCatalog: async (): Promise<PublicCatalog> => {
    const res = await publicClient.get<{ data: PublicCatalog }>('/public/catalog');
    return res.data.data;
  },

  getTracking: async (params: { invoice?: string; phone?: string }): Promise<PublicTrackingData> => {
    const res = await publicClient.get<{ data: PublicTrackingData }>('/public/tracking', { params });
    return res.data.data;
  },
};
