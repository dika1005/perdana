'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw } from 'lucide-react';

import { reportService } from '../../services/reportService';
import { authService, UserProfile } from '../../services/authService';
import { DashboardSummary, MonthlySalesReport, TopProductReport } from '../../types/report';

// Modular Dashboard Components
import { DashboardStatCards } from '../../components/dashboard/DashboardStatCards';
import { DashboardSalesChart } from '../../components/dashboard/DashboardSalesChart';
import { DashboardTopProducts } from '../../components/dashboard/DashboardTopProducts';

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesReport[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentYear = new Date().getFullYear();
      const [summaryRes, monthlyRes, topRes] = await Promise.all([
        reportService.getSummary(),
        reportService.getMonthlySales({ year: currentYear }),
        reportService.getTopProducts(),
      ]);
      setSummary(summaryRes);
      setMonthlySales(monthlyRes);
      setTopProducts(topRes);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data dari database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authService.me().then(u => setUser(u)).catch(() => {});
    fetchDashboardData();
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">
            {isSuperAdmin ? 'Ringkasan Bisnis' : 'Ringkasan Operasional'}
          </h1>
          <p className="text-text-muted">
            {isSuperAdmin 
              ? 'Data performa keuangan & operasional percetakan tahunan.' 
              : 'Pantau antrian pesanan, siap diambil, dan status kasir hari ini.'}
          </p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold skeuo-button text-brand-600 hover:text-brand-700 disabled:opacity-50 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50/50 border border-red-200 text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline font-bold">Coba Lagi</button>
        </div>
      )}

      {/* Stats Cards */}
      <DashboardStatCards summary={summary} isSuperAdmin={isSuperAdmin} />

      {/* Charts & Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isSuperAdmin ? (
          <>
            <DashboardSalesChart data={monthlySales} isSuperAdmin={isSuperAdmin} />
            <DashboardTopProducts topProducts={topProducts} />
          </>
        ) : (
          <div className="lg:col-span-3">
            <DashboardTopProducts topProducts={topProducts} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
