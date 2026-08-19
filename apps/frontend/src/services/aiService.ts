import { apiClient } from '../api/client';
import { ApiResponse } from '../types/api';
import { ParseOrderResponse } from '../types/ai';

export const aiService = {
  parseOrder: (text: string) =>
    apiClient
      .post<ApiResponse<ParseOrderResponse>>('/ai/parse-order', { text })
      .then((r) => r.data.data),
};
