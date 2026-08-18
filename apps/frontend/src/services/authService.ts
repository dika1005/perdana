import { apiClient } from '../api/client';
import { ApiResponse } from '../types/api';

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  is_active: boolean;
  created_at: string;
}

export interface LoginResponseData {
  token: string;
  refresh_token: string;
  user: UserProfile;
}

export const authService = {
  login: async (username: string, password: string) => {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', {
      username,
      password,
    });
    return res.data.data;
  },

  me: async () => {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
    return res.data.data;
  },

  logout: async () => {
    const res = await apiClient.post<ApiResponse<{ ok: boolean }>>('/auth/logout');
    return res.data;
  },
};
