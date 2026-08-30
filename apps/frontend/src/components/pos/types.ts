import { Product, ProductAddon } from '../../types/product';

export interface CartItemAddon {
  addon: ProductAddon;
  price: number;
  qty: number;
}

export interface CartItemMaterial {
  raw_material_id: number;
  material_qty: number;
}

export interface CartItem {
  product: Product;
  qty: number;
  price: number;
  length?: number;
  width?: number;
  addons?: CartItemAddon[];
  materials?: CartItemMaterial[];
}
