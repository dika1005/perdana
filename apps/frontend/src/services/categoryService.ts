import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { Category, CreateCategoryPayload } from '../types/category';

export const categoryService = {
  getProductCategories: async (params?: { search?: string }) => {
    const res = await apiClient.get<ListResponse<Category>>('/product-categories', { params });
    return res.data;
  },

  createProductCategory: async (payload: CreateCategoryPayload) => {
    const res = await apiClient.post<ApiResponse<Category>>('/product-categories', payload);
    return res.data.data;
  },

  getRawMaterialCategories: async (params?: { search?: string }) => {
    const res = await apiClient.get<ListResponse<Category>>('/raw-material-categories', { params });
    return res.data;
  },

  createRawMaterialCategory: async (payload: CreateCategoryPayload) => {
    const res = await apiClient.post<ApiResponse<Category>>('/raw-material-categories', payload);
    return res.data.data;
  },
};
