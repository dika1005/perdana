import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { 
  CreateMaterialLotPayload, 
  CreateMutationPayload, 
  CreateRawMaterialPayload, 
  MaterialLot, 
  MutationItem, 
  RawMaterial, 
  UpsertUomConversionPayload 
} from '../types/rawMaterial';

export const rawMaterialService = {
  getRawMaterials: async (params?: { search?: string; category_id?: number; low_stock?: boolean; page?: number }) => {
    const res = await apiClient.get<ListResponse<RawMaterial>>('/raw-materials', { params });
    return res.data;
  },

  getRawMaterialById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<RawMaterial>>(`/raw-materials/${id}`);
    return res.data.data;
  },

  createRawMaterial: async (payload: CreateRawMaterialPayload) => {
    const res = await apiClient.post<ApiResponse<RawMaterial>>('/raw-materials', payload);
    return res.data.data;
  },

  updateRawMaterial: async (id: number, payload: Partial<CreateRawMaterialPayload>) => {
    const res = await apiClient.put<ApiResponse<RawMaterial>>(`/raw-materials/${id}`, payload);
    return res.data.data;
  },

  deleteRawMaterial: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/raw-materials/${id}`);
    return res.data;
  },

  createMutation: async (payload: CreateMutationPayload) => {
    const res = await apiClient.post<ApiResponse<MutationItem>>('/raw-materials/mutations', payload);
    return res.data.data;
  },

  getMutations: async (rawMaterialId: number, params?: { page?: number }) => {
    const res = await apiClient.get<ListResponse<MutationItem>>(`/raw-materials/${rawMaterialId}/mutations`, { params });
    return res.data;
  },

  getLots: async (rawMaterialId: number) => {
    const res = await apiClient.get<ApiResponse<MaterialLot[]>>(`/raw-materials/${rawMaterialId}/lots`);
    return res.data.data;
  },

  receiveLot: async (rawMaterialId: number, payload: CreateMaterialLotPayload) => {
    const res = await apiClient.post<ApiResponse<MaterialLot>>(`/raw-materials/${rawMaterialId}/lots`, payload);
    return res.data.data;
  },

  upsertUomConversion: async (rawMaterialId: number, payload: UpsertUomConversionPayload) => {
    const res = await apiClient.put<ApiResponse<{ ok: boolean }>>(`/raw-materials/${rawMaterialId}/uom-conversions`, payload);
    return res.data;
  },
};
