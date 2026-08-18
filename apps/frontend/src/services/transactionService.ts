import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { CreateTransactionPayload, OrderStatus, PaymentStatus } from '../types/transaction';

export const transactionService = {
  createTransaction: async (payload: CreateTransactionPayload) => {
    const res = await apiClient.post<ApiResponse<any>>('/transactions', payload);
    return res.data.data;
  },

  getTransactions: async (params?: { 
    page?: number; 
    per_page?: number; 
    search?: string; 
    date?: string; 
    payment_status?: PaymentStatus;
    order_status?: OrderStatus;
  }) => {
    const res = await apiClient.get<ListResponse<any>>('/transactions', { params });
    return res.data;
  },

  getTransactionById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<any>>(`/transactions/${id}`);
    return res.data.data;
  },

  updateOrderStatus: async (id: number, status: OrderStatus) => {
    const res = await apiClient.patch<ApiResponse<any>>(`/transactions/${id}/status`, { order_status: status });
    return res.data.data;
  },

  updatePayment: async (id: number, additionalPayAmount: number, paymentStatus?: PaymentStatus) => {
    const res = await apiClient.patch<ApiResponse<any>>(`/transactions/${id}/payment`, {
      additional_pay_amount: additionalPayAmount,
      payment_status: paymentStatus,
    });
    return res.data.data;
  },

  getInvoiceData: async (id: number) => {
    const res = await apiClient.get<ApiResponse<any>>(`/transactions/${id}/invoice`);
    return res.data.data;
  },
};
