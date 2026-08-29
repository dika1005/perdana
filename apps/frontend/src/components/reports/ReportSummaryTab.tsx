'use client';

import React from 'react';
import { DashboardSummary, MonthlySalesReport, TopProductReport } from '../../types/report';
import { formatRupiah } from '../../utils/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Award, Calendar } from 'lucide-react';

interface ReportSummaryTabProps {
  summary: DashboardSummary | null;
  monthlySales: MonthlySalesReport[];
  topProducts: TopProductReport[];
  selectedYear: number;
}

export const ReportSummaryTab: React.FC<ReportSummaryTabProps> = ({
  summary,
  monthlySales,
  topProducts,
  selectedYear,
}) => {
  const chartData = (monthlySales || []).map(item => ({
    name: item.month_name ? item.month_name.slice(0, 3) : item.month,
    fullName: item.month_name || item.month,
    omset: Number(item.total_sales) || 0,
    expenses: Number(item.total_expenses) || 0,
    profit: Number(item.net_profit) || 0,
    transactions: item.total_transactions || 0,
  }));

  const totalYearSales = (monthlySales || []).reduce((sum, m) => sum + Number(m.total_sales || 0), 0);
  const totalYearExpenses = (monthlySales || []).reduce((sum, m) => sum + Number(m.total_expenses || 0), 0);
  const totalYearProfit = totalYearSales - totalYearExpenses;
  const totalYearTx = (monthlySales || []).reduce((sum, m) => sum + (m.total_transactions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Omset ({selectedYear})</span>
          <p className="text-base font-bold text-text-main font-mono mt-1">{formatRupiah(totalYearSales)}</p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Pengeluaran</span>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">{formatRupiah(totalYearExpenses)}</p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Laba Bersih Tahunan</span>
          <p className={`text-base font-bold font-mono mt-1 ${totalYearProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatRupiah(totalYearProfit)}
          </p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Piutang (DP)</span>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">{formatRupiah(summary?.total_piutang)}</p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transaksi Lunas</span>
          <p className="text-base font-bold text-text-main mt-1">{summary?.paid_transactions || 0} Nota</p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Transaksi ({selectedYear})</span>
          <p className="text-base font-bold text-text-main mt-1">{totalYearTx} Nota</p>
        </div>
      </div>

      {/* Rekonsiliasi Kas Toko (Cash vs QRIS vs Transfer) */}
      <div className="p-5 skeuo rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3.5 flex items-center gap-2">
          <span>🏛️ Rekonsiliasi Kas Masuk (Pemisahan Metode Bayar):</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl skeuo-inset bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">💵 Uang Tunai (Laci Kasir)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Fisik</span>
            </div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {formatRupiah(summary?.total_cash_omset)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Uang tunai riil yang wajib ada di laci kasir.</p>
          </div>

          <div className="p-4 rounded-xl skeuo-inset bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">📱 QRIS / E-Wallet</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Digital</span>
            </div>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">
              {formatRupiah(summary?.total_qris_omset)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total mutasi barcode QRIS yang masuk.</p>
          </div>

          <div className="p-4 rounded-xl skeuo-inset bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">🏦 Transfer Bank</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Bank</span>
            </div>
            <p className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono">
              {formatRupiah(summary?.total_transfer_omset)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total transfer rekening langsung.</p>
          </div>
        </div>
      </div>

      {/* Grafik Tren Penjualan Bulanan */}
      <div className="skeuo p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-text-main">Grafik Penjualan & Laba Bulanan (Tahun {selectedYear})</h3>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Rekap 12 Bulan
            </span>
          </div>
          <span className="text-xs text-text-muted">Januari – Desember {selectedYear}</span>
        </div>

        <div className="h-72 w-full p-4 rounded-xl flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatRupiah(value / 1000, true)}k`} />
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
              <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="profit" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Tabel Rekapitulasi 12 Bulan & Top 5 Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel Rekapitulasi 12 Bulan */}
        <div className="lg:col-span-2 skeuo p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Tabel Rekapitulasi Penjualan Bulanan ({selectedYear})</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{monthlySales.length} Bulan</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Bulan</th>
                  <th className="py-2.5 px-3 text-right">Omset</th>
                  <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                  <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                  <th className="py-2.5 px-3 text-center">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {monthlySales.map((m, i) => {
                  const s = Number(m.total_sales) || 0;
                  const e = Number(m.total_expenses) || 0;
                  const p = Number(m.net_profit) || 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-text-main">{m.month_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{formatRupiah(s)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-500 dark:text-rose-400">{formatRupiah(e)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${p >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                        {formatRupiah(p)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{m.total_transactions}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/70 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-800">
                <tr>
                  <td className="py-2.5 px-3 text-text-main">TOTAL TAHUNAN</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-300">{formatRupiah(totalYearSales)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">{formatRupiah(totalYearExpenses)}</td>
                  <td className={`py-2.5 px-3 text-right font-mono ${totalYearProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {formatRupiah(totalYearProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{totalYearTx}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Top 5 Produk Terlaris */}
        <div className="skeuo p-6">
          <h3 className="font-bold text-sm text-text-main mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Top 5 Produk Terlaris</span>
          </h3>
          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada produk terjual.</p>
            ) : (
              topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="truncate block font-semibold text-text-main">#{i+1} {p.product_name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{p.total_qty} terjual</span>
                  </div>
                  <span className="font-bold text-text-main font-mono shrink-0">{formatRupiah(p.total_revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
