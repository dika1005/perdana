export type MutationType = 'IN' | 'OUT';

export interface RawMaterial {
  id: number;
  category_id?: number | null;
  name: string;
  variant?: string | null;
  unit: string;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_warning: number;
  standard_cost: number;
  roll_width?: number | null;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRawMaterialPayload {
  category_id?: number;
  name: string;
  variant?: string;
  unit?: string;
  stock?: number;
  min_stock_warning?: number;
  standard_cost?: number;
  roll_width?: number;
}

export interface CreateMutationPayload {
  raw_material_id: number;
  type: MutationType;
  qty: number;
  notes?: string;
}

export interface MutationItem {
  id: number;
  raw_material_id: number;
  type: MutationType;
  qty: number;
  notes?: string | null;
  created_at: string;
}

export interface MaterialLot {
  id: number;
  raw_material_id: number;
  lot_code: string;
  source_lot_id?: number | null;
  width_m?: number | null;
  length_total: number;
  length_remaining: number;
  reserved_length: number;
  is_offcut: boolean;
  status: string;
  unit_cost: number;
  received_at: string;
}

export interface CreateMaterialLotPayload {
  lot_code: string;
  width_m: number;
  length: number;
  unit_cost?: number;
  notes?: string;
}

export interface UpsertUomConversionPayload {
  from_unit: string;
  to_unit: string;
  factor: number;
  notes?: string;
}
