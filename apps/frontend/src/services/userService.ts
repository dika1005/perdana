import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { User, CreateUserPayload, UpdateUserPayload } from '../types/user';

export const userService = {
  getUsers: (params?: { page?: number; search?: string; role?: string }) =>
    apiClient.get<ListResponse<User>>('/users', { params }).then((r) => r.data),

  getUserById: (id: number) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`).then((r) => r.data.data),

  createUser: (payload: CreateUserPayload) =>
    apiClient.post<ApiResponse<User>>('/users', payload).then((r) => r.data.data),

  updateUser: (id: number, payload: UpdateUserPayload) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, payload).then((r) => r.data.data),

  resetPassword: (id: number, password: string) =>
    apiClient.patch(`/users/${id}/password`, { password }).then((r) => r.data),

  deactivateUser: (id: number) =>
    apiClient.delete(`/users/${id}`).then((r) => r.data),
};
