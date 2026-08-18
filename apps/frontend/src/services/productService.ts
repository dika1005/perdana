import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { Product, ProductAddon } from '../types/product';

export const productService = {
  getProducts: async (params?: { page?: number; search?: string; category_id?: number }) => {
    const res = await apiClient.get<ListResponse<Product>>('/products', { params });
    return res.data;
  },

  getProductById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  getAddons: async (params?: { search?: string }) => {
    const res = await apiClient.get<ListResponse<ProductAddon>>('/addons', { params });
    return res.data.data;
  },

  createProduct: async (payload: Partial<Product>) => {
    const res = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return res.data.data;
  },
};
