'use client';

import React from 'react';
import { TopProductReport } from '../../types/report';

interface DashboardTopProductsProps {
  topProducts: TopProductReport[];
}

export const DashboardTopProducts: React.FC<DashboardTopProductsProps> = ({ topProducts }) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-sm font-bold text-text-main">Top Produk Terlaris</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
          {topProducts.length} Produk
        </span>
      </div>

      <div className="space-y-2.5">
        {topProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
            Belum ada data penjualan produk.
          </div>
        ) : (
          topProducts.slice(0, 5).map((product, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60 shrink-0">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-text-main truncate">{product.product_name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{product.total_qty} transaksi</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-text-main font-mono">
                  Rp {Number(product.total_revenue).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
