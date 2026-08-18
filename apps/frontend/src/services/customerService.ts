import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { CreateCustomerPayload, Customer } from '../types/customer';

export const customerService = {
  getCustomers: async (params?: { search?: string; page?: number }) => {
    const res = await apiClient.get<ListResponse<Customer>>('/customers', { params });
    return res.data;
  },

  getCustomerById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data.data;
  },

  createCustomer: async (payload: CreateCustomerPayload) => {
    const res = await apiClient.post<ApiResponse<Customer>>('/customers', payload);
    return res.data.data;
  },

  updateCustomer: async (id: number, payload: Partial<CreateCustomerPayload>) => {
    const res = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return res.data.data;
  },

  deleteCustomer: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/customers/${id}`);
    return res.data;
  },
};
