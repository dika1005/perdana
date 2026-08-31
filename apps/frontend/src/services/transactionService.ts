import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { CreateTransactionPayload, OrderStatus, PaymentMethod, PaymentStatus, TransactionDetail } from '../types/transaction';

export const transactionService = {
  createTransaction: async (payload: CreateTransactionPayload) => {
    const res = await apiClient.post<ApiResponse<TransactionDetail>>('/transactions', payload);
    return res.data.data;
  },

  getTransactions: async (params?: { 
    page?: number; 
    per_page?: number; 
    search?: string; 
    date?: string; 
    payment_status?: PaymentStatus;
    payment_method?: PaymentMethod;
    order_status?: OrderStatus;
  }) => {
    const res = await apiClient.get<ListResponse<TransactionDetail>>('/transactions', { params });
    return res.data;
  },

  getTransactionById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<TransactionDetail>>(`/transactions/${id}`);
    return res.data.data;
  },

  updateOrderStatus: async (id: number, status: OrderStatus) => {
    const res = await apiClient.patch<ApiResponse<TransactionDetail>>(`/transactions/${id}/status`, { order_status: status });
    return res.data.data;
  },

  updatePayment: async (id: number, additionalPayAmount: number, _paymentStatus?: PaymentStatus, paymentMethod?: PaymentMethod, referenceNo?: string, notes?: string) => {
    const res = await apiClient.patch<ApiResponse<TransactionDetail>>(`/transactions/${id}/payment`, {
      additional_pay_amount: additionalPayAmount,
      payment_method: paymentMethod,
      reference_no: referenceNo,
      notes: notes,
    });
    return res.data.data;
  },

  refundPayment: async (id: number, amount: number, paymentMethod: PaymentMethod, reason: string, referenceNo?: string) => {
    const res = await apiClient.post<ApiResponse<TransactionDetail>>(`/transactions/${id}/refund`, {
      amount,
      payment_method: paymentMethod,
      reason,
      reference_no: referenceNo,
    });
    return res.data.data;
  },

  settle: async (id: number, payAmount: number, paymentMethod?: PaymentMethod, referenceNo?: string, notes?: string) => {
    const res = await apiClient.post<ApiResponse<TransactionDetail>>(`/transactions/${id}/settle`, {
      pay_amount: payAmount,
      payment_method: paymentMethod,
      reference_no: referenceNo,
      notes: notes,
    });
    return res.data.data;
  },

  recordWaste: async (id: number, materials: Array<{ transaction_item_material_id: number; qty: number; reason_code: string; notes?: string }>, notes?: string) => {
    const res = await apiClient.post<ApiResponse<TransactionDetail>>(`/transactions/${id}/waste`, {
      materials,
      notes,
    });
    return res.data.data;
  },

  recordRework: async (id: number, materials: Array<{ transaction_item_material_id: number; qty: number; reason_code: string }>, notes?: string) => {
    const res = await apiClient.post<ApiResponse<TransactionDetail>>(`/transactions/${id}/rework`, {
      materials,
      notes,
    });
    return res.data.data;
  },

  getInvoiceData: async (id: number) => {
    const res = await apiClient.get<ApiResponse<any>>(`/transactions/${id}/invoice`);
    return res.data.data;
  },

  cancelTransaction: async (id: number, reason: string) => {
    const res = await apiClient.post<ApiResponse<TransactionDetail>>(`/transactions/${id}/cancel`, {
      reason,
    });
    return res.data.data;
  },
};
