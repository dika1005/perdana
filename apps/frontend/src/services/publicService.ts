import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800/api/v1';

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

export const publicService = {
  getCatalog: async (): Promise<PublicCatalog> => {
    const res = await publicClient.get<{ data: PublicCatalog }>('/public/catalog');
    return res.data.data;
  },
};
