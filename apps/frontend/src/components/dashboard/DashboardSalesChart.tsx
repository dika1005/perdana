'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatRupiah } from '../../utils/format';
import { MonthlySalesReport } from '../../types/report';
import { TrendingUp } from 'lucide-react';

interface DashboardSalesChartProps {
  data: MonthlySalesReport[];
  isSuperAdmin?: boolean;
}

export const DashboardSalesChart: React.FC<DashboardSalesChartProps> = ({ data, isSuperAdmin = false }) => {
  const currentYear = new Date().getFullYear();

  const chartData = (data || []).map(item => ({
    name: item.month_name ? item.month_name.slice(0, 3) : item.month,
    fullName: item.month_name || item.month,
    omset: Number(item.total_sales) || 0,
    expenses: Number(item.total_expenses) || 0,
    profit: Number(item.net_profit) || 0,
    transactions: item.total_transactions || 0,
  }));

  const totalAnnualOmset = chartData.reduce((sum, item) => sum + item.omset, 0);

  return (
    <div className="lg:col-span-2 skeuo p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-main">Grafik Penjualan Bulanan (Tahun {currentYear})</h2>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Rekap 12 Bulan
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Total Omset Tahunan: <span className="font-bold font-mono text-text-main">{formatRupiah(totalAnnualOmset)}</span>
          </p>
        </div>

        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
          Real-time Database
        </span>
      </div>

      <div className="h-72 w-full p-4 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
        {chartData.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 text-sm">
            <p className="font-semibold">Belum ada riwayat transaksi di database.</p>
            <p className="text-xs mt-1">Buat transaksi baru di menu POS untuk melihat grafik.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.6} vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${formatRupiah(value / 1000, true)}k`} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-skeuo)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-skeuo)', 
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  color: 'var(--color-text-main)',
                  fontSize: '12px',
                  padding: '10px 14px'
                }}
                labelStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: any, name: any, item: any) => {
                  const valNum = Number(value) || 0;
                  const label = name === 'omset' ? 'Omset Penjualan' : name === 'profit' ? 'Laba Bersih' : 'Pengeluaran';
                  return [formatRupiah(valNum), `${label} (${item.payload.transactions} nota)`];
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => {
                  if (value === 'omset') return <span className="text-xs font-semibold text-text-main">Omset Penjualan</span>;
                  if (value === 'profit') return <span className="text-xs font-semibold text-text-main">Laba Bersih</span>;
                  return <span className="text-xs font-semibold text-text-main">Pengeluaran</span>;
                }}
              />
              <Bar dataKey="omset" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
              {isSuperAdmin && (
                <Bar dataKey="profit" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={36} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
