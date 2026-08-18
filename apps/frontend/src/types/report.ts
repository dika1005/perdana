export interface DashboardSummary {
  total_omset: number;
  total_transactions: number;
  paid_transactions: number;
  dp_transactions: number;
  unpaid_transactions: number;
  total_piutang: number;
  active_orders: number;
  ready_orders: number;
  low_stock_raw_materials_count: number;
}

export interface DailySalesReport {
  date: string;
  total_sales: number;
  total_transactions: number;
}

export interface TopProductReport {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export interface InventoryMutationReport {
  raw_material_id: number;
  raw_material_name: string;
  in_qty: number;
  out_qty: number;
  current_stock: number;
}
