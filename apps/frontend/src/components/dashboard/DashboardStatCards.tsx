'use client';

import React from 'react';
import { TrendingUp, TrendingDown, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { DashboardSummary } from '../../types/report';

import { formatRupiah } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="skeuo p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
        {subtitle}
      </span>
    </div>
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
      <p className="text-lg sm:text-xl font-bold text-text-main font-mono tracking-tight">{value}</p>
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
        value={formatRupiah(summary?.total_omset)} 
        icon={TrendingUp} 
        colorClass="text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/50" 
        subtitle={`${summary?.total_transactions || 0} transaksi`}
      />
      <StatCard 
        title="Total Pengeluaran" 
        value={formatRupiah(summary?.total_expenses)} 
        icon={TrendingDown} 
        colorClass="text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/50" 
        subtitle="Biaya operasional"
      />
      <StatCard 
        title="Laba Bersih" 
        value={formatRupiah(summary?.net_profit)} 
        icon={TrendingUp} 
        colorClass={Number(summary?.net_profit || 0) >= 0 
          ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50" 
          : "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/50"} 
        subtitle="Omset - Pengeluaran"
      />
      <StatCard 
        title="Total Piutang" 
        value={formatRupiah(summary?.total_piutang)} 
        icon={CreditCard} 
        colorClass="text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50" 
        subtitle={`${Number(summary?.dp_transactions || 0) + Number(summary?.unpaid_transactions || 0)} belum lunas`}
      />
      <StatCard 
        title="Pesanan Aktif" 
        value={`${summary?.active_orders || 0}`} 
        icon={Clock} 
        colorClass="text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/50" 
        subtitle={`${summary?.ready_orders || 0} siap diambil`}
      />
      <StatCard 
        title="Bahan Menipis" 
        value={`${summary?.low_stock_raw_materials_count || 0} Item`} 
        icon={AlertTriangle} 
        colorClass="text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/50" 
        subtitle="Perlu restock"
      />
    </div>
  );
};
