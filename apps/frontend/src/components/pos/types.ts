import { Product } from '../../types/product';

export interface CartItem {
  product: Product;
  qty: number;
  price: number;
  length?: number;
  width?: number;
}
