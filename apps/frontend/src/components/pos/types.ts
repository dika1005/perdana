import { Product, ProductAddon } from '../../types/product';

export interface CartItemAddon {
  addon: ProductAddon;
  price: number;
  qty: number;
}

export interface CartItemMaterial {
  raw_material_id: number;
  material_qty: number;
  material_name?: string;
  material_unit?: string;
  material_stock?: number;
}

export interface CartItem {
  product: Product;
  qty: number;
  price: number;
  length?: number;
  width?: number;
  addons?: CartItemAddon[];
  /** @deprecated Use materials[] instead */
  raw_material_id?: number;
  /** @deprecated Use materials[] instead */
  material_qty?: number;
  /** Multiple raw materials consumed per item */
  materials?: CartItemMaterial[];
}
