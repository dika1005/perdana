'use client';

import React from 'react';
import { DashboardSummary, DailySalesReport, TopProductReport } from '../../types/report';
import { formatRupiah } from '../../utils/format';

interface ReportSummaryTabProps {
  summary: DashboardSummary | null;
  dailySales: DailySalesReport[];
  topProducts: TopProductReport[];
}

export const ReportSummaryTab: React.FC<ReportSummaryTabProps> = ({
  summary,
  dailySales,
  topProducts,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Omset</span>
          <p className="text-base font-bold text-text-main font-mono mt-1">{formatRupiah(summary?.total_omset)}</p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Pengeluaran</span>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">{formatRupiah(summary?.total_expenses)}</p>
        </div>
        <div className="skeuo p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Laba Bersih</span>
          <p className={`text-base font-bold font-mono mt-1 ${Number(summary?.net_profit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatRupiah(summary?.net_profit)}
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
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Transaksi</span>
          <p className="text-base font-bold text-text-main mt-1">{summary?.total_transactions || 0} Nota</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeuo p-6">
          <h3 className="font-bold text-xs text-text-main mb-4">Grafik Penjualan Harian</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {dailySales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi pada periode ini.</p>
            ) : (
              dailySales.map((d, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="font-medium text-text-main">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-slate-500 dark:text-slate-400">{d.total_transactions} nota</span>
                  <span className="font-bold text-text-main font-mono">{formatRupiah(d.total_sales)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="skeuo p-6">
          <h3 className="font-bold text-xs text-text-main mb-4">Top 5 Produk Terlaris</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada produk terjual.</p>
            ) : (
              topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="truncate max-w-[200px] font-medium text-text-main">#{i+1} {p.product_name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{p.total_qty} terjual</span>
                  <span className="font-bold text-text-main font-mono">{formatRupiah(p.total_revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
