export type ExpenseCategory = 
  | 'BAHAN_BAKU' 
  | 'OPERASIONAL' 
  | 'MAINTENANCE' 
  | 'GAJI' 
  | 'LAINNYA';

export type ExpensePaymentMethod = 'CASH' | 'TRANSFER';

export interface ExpenseItem {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: ExpensePaymentMethod;
  notes?: string | null;
  expense_date: string;
  created_by?: number | null;
  creator_name?: string | null;
  created_at: string;
}

export interface ExpenseCategoryBreakdown {
  category: ExpenseCategory;
  total_amount: number;
  count: number;
}

export interface ExpenseSummary {
  total_amount: number;
  total_count: number;
  today_amount: number;
  month_amount: number;
  by_category: ExpenseCategoryBreakdown[];
}

export interface CreateExpensePayload {
  title: string;
  category?: ExpenseCategory;
  amount: number;
  payment_method?: ExpensePaymentMethod;
  notes?: string;
  expense_date?: string;
}

export interface UpdateExpensePayload {
  title: string;
  category?: ExpenseCategory;
  amount: number;
  payment_method?: ExpensePaymentMethod;
  notes?: string;
  expense_date?: string;
}

export interface ExpenseQuery {
  page?: number;
  per_page?: number;
  category?: ExpenseCategory;
  payment_method?: ExpensePaymentMethod;
  search?: string;
  start_date?: string;
  end_date?: string;
}
