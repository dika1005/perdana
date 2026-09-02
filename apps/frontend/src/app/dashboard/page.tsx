'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw } from 'lucide-react';

import { useDashboard } from '../../hooks/useDashboard';
import { PageHeader, Button, ErrorBanner } from '../../components/shared';

// Modular Dashboard Components
import { DashboardStatCards } from '../../components/dashboard/DashboardStatCards';
import { DashboardSalesChart } from '../../components/dashboard/DashboardSalesChart';
import { DashboardTopProducts } from '../../components/dashboard/DashboardTopProducts';

export default function Dashboard() {
  const {
    user,
    summary,
    monthlySales,
    topProducts,
    errorMessage,
    refetch,
    isRefreshing,
  } = useDashboard();

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
          <Button variant="secondary" onClick={() => refetch()} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Segarkan Data
          </Button>
        }
      />

      {errorMessage && (
        <ErrorBanner message={errorMessage} onRetry={() => refetch()} />
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