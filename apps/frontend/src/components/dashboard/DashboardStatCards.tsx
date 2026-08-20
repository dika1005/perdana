'use client';

import React from 'react';
import { TrendingUp, TrendingDown, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { DashboardSummary } from '../../types/report';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="skeuo p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm font-medium text-text-muted">{subtitle}</span>
    </div>
    <div>
      <h3 className="text-text-muted font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-text-main">{value}</p>
    </div>
  </div>
);

interface DashboardStatCardsProps {
  summary: DashboardSummary | null;
}

export const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <StatCard 
        title="Total Omset" 
        value={`Rp ${(summary?.total_omset || 0).toLocaleString('id-ID')}`} 
        icon={TrendingUp} 
        colorClass="text-brand-500" 
        subtitle={`${summary?.total_transactions || 0} transaksi`}
      />
      <StatCard 
        title="Total Pengeluaran" 
        value={`Rp ${(summary?.total_expenses || 0).toLocaleString('id-ID')}`} 
        icon={TrendingDown} 
        colorClass="text-red-500" 
        subtitle="Biaya & operasional"
      />
      <StatCard 
        title="Laba Bersih" 
        value={`Rp ${(summary?.net_profit || 0).toLocaleString('id-ID')}`} 
        icon={TrendingUp} 
        colorClass={(summary?.net_profit || 0) >= 0 ? "text-emerald-500" : "text-red-500"} 
        subtitle="Omset - Pengeluaran"
      />
      <StatCard 
        title="Total Piutang" 
        value={`Rp ${(summary?.total_piutang || 0).toLocaleString('id-ID')}`} 
        icon={CreditCard} 
        colorClass="text-amber-500" 
        subtitle={`${(summary?.dp_transactions || 0) + (summary?.unpaid_transactions || 0)} belum lunas`}
      />
      <StatCard 
        title="Pesanan Aktif" 
        value={`${summary?.active_orders || 0}`} 
        icon={Clock} 
        colorClass="text-blue-500" 
        subtitle={`${summary?.ready_orders || 0} siap diambil`}
      />
      <StatCard 
        title="Bahan Menipis" 
        value={`${summary?.low_stock_raw_materials_count || 0} Item`} 
        icon={AlertTriangle} 
        colorClass="text-rose-500" 
        subtitle="Perlu restock"
      />
    </div>
  );
};
