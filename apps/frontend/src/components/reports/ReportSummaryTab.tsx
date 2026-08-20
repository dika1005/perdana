'use client';

import React from 'react';
import { DashboardSummary, DailySalesReport, TopProductReport } from '../../types/report';

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
        <div className="skeuo p-5">
          <span className="text-xs text-text-muted">Total Omset</span>
          <p className="text-lg font-bold text-brand-600 mt-1">Rp {(summary?.total_omset || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="skeuo p-5">
          <span className="text-xs text-text-muted">Total Pengeluaran</span>
          <p className="text-lg font-bold text-red-500 mt-1">Rp {(summary?.total_expenses || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="skeuo p-5">
          <span className="text-xs text-text-muted">Laba Bersih</span>
          <p className={`text-lg font-bold mt-1 ${(summary?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            Rp {(summary?.net_profit || 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="skeuo p-5">
          <span className="text-xs text-text-muted">Total Piutang (DP)</span>
          <p className="text-lg font-bold text-amber-500 mt-1">Rp {(summary?.total_piutang || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="skeuo p-5">
          <span className="text-xs text-text-muted">Transaksi Lunas</span>
          <p className="text-lg font-bold text-emerald-600 mt-1">{summary?.paid_transactions || 0} Nota</p>
        </div>
        <div className="skeuo p-5">
          <span className="text-xs text-text-muted">Total Transaksi</span>
          <p className="text-lg font-bold text-text-main mt-1">{summary?.total_transactions || 0} Nota</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeuo p-6">
          <h3 className="font-bold text-sm text-text-main mb-4">Grafik Penjualan Harian</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {dailySales.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">Belum ada transaksi pada periode ini.</p>
            ) : (
              dailySales.map((d, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl skeuo-inset text-xs font-semibold">
                  <span>{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-text-muted">{d.total_transactions} nota</span>
                  <span className="font-bold text-brand-600">Rp {Number(d.total_sales).toLocaleString('id-ID')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="skeuo p-6">
          <h3 className="font-bold text-sm text-text-main mb-4">Top 5 Produk Terlaris</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {topProducts.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">Belum ada produk terjual.</p>
            ) : (
              topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl skeuo-inset text-xs font-semibold">
                  <span className="truncate max-w-[200px]">#{i+1} {p.product_name}</span>
                  <span className="text-text-muted">{p.total_qty} terjual</span>
                  <span className="font-bold text-brand-600">Rp {Number(p.total_revenue).toLocaleString('id-ID')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
