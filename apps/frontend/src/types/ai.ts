export interface ParsedOrderItem {
  product_id?: number | null;
  product_name: string;
  matched_product_name?: string | null;
  length?: number | null;
  width?: number | null;
  qty: number;
  unit_price?: number | null;
  subtotal?: number | null;
  notes?: string | null;
}

export interface ParseOrderResponse {
  customer_name_hint?: string | null;
  items: ParsedOrderItem[];
  notes?: string | null;
  used_model: string;
}
