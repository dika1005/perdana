import { apiClient } from '../api/client';
import { ApiResponse } from '../types/api';
import { DailySalesReport, DashboardSummary, InventoryMutationReport, TopProductReport } from '../types/report';

export const reportService = {
  getSummary: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/reports/summary', { params });
    return res.data.data;
  },

  getDailySales: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<DailySalesReport[]>>('/reports/daily-sales', { params });
    return res.data.data;
  },

  getTopProducts: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<TopProductReport[]>>('/reports/top-products', { params });
    return res.data.data;
  },

  getInventoryMutations: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<InventoryMutationReport[]>>('/reports/inventory-mutations', { params });
    return res.data.data;
  },
};
