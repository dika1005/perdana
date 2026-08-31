'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw } from 'lucide-react';

import { reportService } from '../../services/reportService';
import { authService, UserProfile } from '../../services/authService';
import { DashboardSummary, MonthlySalesReport, TopProductReport } from '../../types/report';
import { PageHeader, Button, ErrorBanner } from '../../components/shared';

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
      <PageHeader
        title={isSuperAdmin ? 'Ringkasan Bisnis' : 'Ringkasan Operasional'}
        subtitle={
          isSuperAdmin
            ? 'Data performa keuangan & operasional percetakan tahunan.'
            : 'Pantau antrian pesanan, siap diambil, dan status kasir hari ini.'
        }
        actions={
          <Button variant="secondary" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchDashboardData} />}

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
