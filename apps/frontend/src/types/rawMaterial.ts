export type MutationType = 'IN' | 'OUT';

export interface RawMaterial {
  id: number;
  category_id?: number | null;
  name: string;
  variant?: string | null;
  unit: string;
  stock: number;
  min_stock_warning: number;
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
