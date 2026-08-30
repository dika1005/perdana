import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { BomLineInput, Product, ProductBom, ProductVariant, ProductAddon } from '../types/product';
import { Category } from '../types/category';

export const productService = {
  // Master Produk
  getProducts: (params?: { page?: number; search?: string; category_id?: number }) =>
    apiClient.get<ListResponse<Product>>('/products', { params }).then((r) => r.data),
  getProductById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`).then((r) => r.data.data),
  createProduct: (payload: any) =>
    apiClient.post<ApiResponse<Product>>('/products', payload).then((r) => r.data.data),
  updateProduct: (id: number, payload: any) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload).then((r) => r.data.data),
  deleteProduct: (id: number) =>
    apiClient.delete(`/products/${id}`).then((r) => r.data),

  // Varian Produk
  getVariants: (productId: number) =>
    apiClient.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants`).then((r) => r.data.data),
  createVariant: (productId: number, payload: any) =>
    apiClient.post<ApiResponse<ProductVariant>>(`/products/${productId}/variants`, payload).then((r) => r.data.data),
  updateVariant: (id: number, payload: any) =>
    apiClient.put<ApiResponse<ProductVariant>>(`/product-variants/${id}`, payload).then((r) => r.data.data),
  deleteVariant: (id: number) =>
    apiClient.delete(`/product-variants/${id}`).then((r) => r.data),

  // Add-ons & Finishing
  getAddons: (params?: { search?: string }) =>
    apiClient.get<ListResponse<ProductAddon>>('/addons', { params }).then((r) => r.data.data),
  createAddon: (payload: any) =>
    apiClient.post<ApiResponse<ProductAddon>>('/addons', payload).then((r) => r.data.data),
  updateAddon: (id: number, payload: any) =>
    apiClient.put<ApiResponse<ProductAddon>>(`/addons/${id}`, payload).then((r) => r.data.data),
  deleteAddon: (id: number) =>
    apiClient.delete(`/addons/${id}`).then((r) => r.data),

  // Server-side production recipes. These are the source of truth for stock;
  // the POS only sends product, variant, qty, dimensions, and add-ons.
  getProductBom: (productId: number, productVariantId?: number) =>
    apiClient.get<ApiResponse<ProductBom | null>>(`/products/${productId}/bom`, {
      params: productVariantId ? { product_variant_id: productVariantId } : undefined,
    }).then((r) => r.data.data),
  saveProductBom: (productId: number, payload: { product_variant_id?: number; output_qty?: number; notes?: string; lines: BomLineInput[] }) =>
    apiClient.put<ApiResponse<ProductBom>>(`/products/${productId}/bom`, payload).then((r) => r.data.data),
  getAddonBom: (addonId: number) =>
    apiClient.get<ApiResponse<BomLineInput[]>>(`/addons/${addonId}/bom`).then((r) => r.data.data),
  saveAddonBom: (addonId: number, lines: BomLineInput[]) =>
    apiClient.put<ApiResponse<BomLineInput[]>>(`/addons/${addonId}/bom`, { lines }).then((r) => r.data.data),

  // Kategori Produk
  getCategories: () =>
    apiClient.get<ListResponse<Category>>('/product-categories').then((r) => r.data.data),
  createCategory: (payload: any) =>
    apiClient.post<ApiResponse<Category>>('/product-categories', payload).then((r) => r.data.data),
  updateCategory: (id: number, payload: any) =>
    apiClient.put<ApiResponse<Category>>(`/product-categories/${id}`, payload).then((r) => r.data.data),
  deleteCategory: (id: number) =>
    apiClient.delete(`/product-categories/${id}`).then((r) => r.data),
};
