export type PriceType = 'FIXED' | 'RANGE' | 'CUSTOM';
export type RangePriceType = 'FIXED' | 'RANGE';

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  price_type: RangePriceType;
  price: number;
  min_price: number;
  max_price: number;
  created_at: string;
}

export interface Product {
  id: number;
  category_id?: number | null;
  name: string;
  price_type: PriceType;
  default_price: number;
  min_price: number;
  max_price: number;
  min_order: number;
  unit_name: string;
  has_variants: boolean;
  created_at: string;
  variants?: ProductVariant[];
}

export interface ProductAddon {
  id: number;
  name: string;
  price_type: RangePriceType;
  default_price: number;
  min_price: number;
  max_price: number;
  created_at: string;
}
