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
  is_active: boolean;
  raw_material_id?: number | null;
  material_amount?: number | string | null;
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
  is_active: boolean;
  raw_material_id?: number | null;
  material_amount?: number | string | null;
  created_at: string;
  variants?: ProductVariant[];
}

export interface ProductAddon {
  id: number;
  category_id?: number | null;
  category_name?: string | null;
  name: string;
  price_type: RangePriceType;
  default_price: number;
  min_price: number;
  max_price: number;
  is_active: boolean;
  created_at: string;
}

export type ConsumptionBasis = 'PER_UNIT' | 'PER_AREA' | 'PER_LENGTH' | 'FIXED';

export interface BomLineInput {
  raw_material_id: number;
  component_type?: 'MATERIAL' | 'FINISHING' | 'PACKAGING';
  consumption_basis: ConsumptionBasis;
  qty_per_output: number;
  waste_pct?: number;
  width_requirement_m?: number;
  allow_offcut?: boolean;
  is_required?: boolean;
}

export interface ProductBom {
  id: number;
  product_id: number;
  product_variant_id?: number | null;
  version: number;
  output_qty: number;
  notes?: string | null;
  lines: BomLineInput[];
}
