'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw } from 'lucide-react';

import { reportService } from '../../services/reportService';
import { authService, UserProfile } from '../../services/authService';
import { DailySalesReport, DashboardSummary, TopProductReport } from '../../types/report';

// Modular Dashboard Components
import { DashboardStatCards } from '../../components/dashboard/DashboardStatCards';
import { DashboardSalesChart } from '../../components/dashboard/DashboardSalesChart';
import { DashboardTopProducts } from '../../components/dashboard/DashboardTopProducts';

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<DailySalesReport[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, salesRes, topRes] = await Promise.all([
        reportService.getSummary(),
        reportService.getDailySales(),
        reportService.getTopProducts(),
      ]);
      setSummary(summaryRes);
      setSalesData(salesRes);
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

  const formattedSalesData = salesData.map(item => ({
    name: new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
    total: Number(item.total_sales),
    transaksi: item.total_transactions,
  }));

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">
            {isSuperAdmin ? 'Ringkasan Bisnis' : 'Ringkasan Operasional'}
          </h1>
          <p className="text-text-muted">
            {isSuperAdmin 
              ? 'Data performa keuangan & operasional percetakan.' 
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
            <DashboardSalesChart data={formattedSalesData} />
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
