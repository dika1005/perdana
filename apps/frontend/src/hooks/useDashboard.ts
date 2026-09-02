'use client';

import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { authService, UserProfile } from '../services/authService';
import { DashboardSummary, MonthlySalesReport, TopProductReport } from '../types/report';

export interface DashboardData {
  user: UserProfile | null;
  summary: DashboardSummary | null;
  monthlySales: MonthlySalesReport[];
  topProducts: TopProductReport[];
}

/**
 * Mengambil seluruh data dashboard (profil, summary, penjualan bulanan,
 * produk terlaris) via React Query. Mendapat caching + dedup otomatis:
 * kembali ke halaman dashboard dalam 30 detik tidak refetch.
 */
export function useDashboard() {
  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const reportsQuery = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const [summary, monthlySales, topProducts] = await Promise.all([
        reportService.getSummary(),
        reportService.getMonthlySales({ year: currentYear }),
        reportService.getTopProducts(),
      ]);
      return { summary, monthlySales, topProducts };
    },
  });

  const error =
    reportsQuery.error instanceof Error
      ? reportsQuery.error
      : reportsQuery.error
        ? new Error('Gagal memuat data dari database')
        : null;

  return {
    user: userQuery.data ?? null,
    summary: reportsQuery.data?.summary ?? null,
    monthlySales: reportsQuery.data?.monthlySales ?? [],
    topProducts: reportsQuery.data?.topProducts ?? [],
    loading: reportsQuery.isPending,
    error: error ? (error as { response?: { data?: { message?: string } } }) : null,
    errorMessage: (error as { response?: { data?: { message?: string } } } | null)?.response?.data
      ?.message ?? null,
    refetch: () => reportsQuery.refetch(),
    isRefreshing: reportsQuery.isFetching,
  };
}