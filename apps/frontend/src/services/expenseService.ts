import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import {
  CreateExpensePayload,
  ExpenseItem,
  ExpenseQuery,
  ExpenseSummary,
  UpdateExpensePayload,
} from '../types/expense';

export const expenseService = {
  getExpenses: async (params?: ExpenseQuery) => {
    const res = await apiClient.get<ListResponse<ExpenseItem>>('/expenses', { params });
    return res.data;
  },

  getSummary: async (params?: ExpenseQuery) => {
    const res = await apiClient.get<ApiResponse<ExpenseSummary>>('/expenses/summary', { params });
    return res.data.data;
  },

  getExpenseById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<ExpenseItem>>(`/expenses/${id}`);
    return res.data.data;
  },

  createExpense: async (payload: CreateExpensePayload) => {
    const res = await apiClient.post<ApiResponse<ExpenseItem>>('/expenses', payload);
    return res.data.data;
  },

  updateExpense: async (id: number, payload: UpdateExpensePayload) => {
    const res = await apiClient.put<ApiResponse<ExpenseItem>>(`/expenses/${id}`, payload);
    return res.data.data;
  },

  deleteExpense: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<{ ok: boolean }>>(`/expenses/${id}`);
    return res.data;
  },
};
