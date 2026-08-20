export interface DashboardSummary {
  total_omset: number;
  total_expenses: number;
  net_profit: number;
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

export type DailySalesItem = DailySalesReport;

export interface TopProductReport {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export type TopProductItem = TopProductReport;

export interface InventoryMutationReport {
  raw_material_id: number;
  raw_material_name: string;
  in_qty: number;
  out_qty: number;
  current_stock: number;
}

export type InventoryMutationItem = InventoryMutationReport;

export interface ReceivableItem {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  pay_amount: number;
  remaining_amount: number;
  payment_status: 'DP' | 'UNPAID';
  order_status: string;
  created_at: string;
}

export interface LowStockItem {
  id: number;
  category_id?: number | null;
  name: string;
  variant?: string | null;
  unit: string;
  stock: number;
  min_stock_warning: number;
  is_low_stock: boolean;
}
