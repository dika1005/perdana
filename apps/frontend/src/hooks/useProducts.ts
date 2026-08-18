import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';

export const useProducts = (params?: { page?: number; search?: string; category_id?: number }) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
  });
};
