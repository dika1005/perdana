'use client';

import React from 'react';
import { TopProductReport } from '../../types/report';
import { formatRupiah } from '../../utils/format';

interface DashboardTopProductsProps {
  topProducts: TopProductReport[];
}

export const DashboardTopProducts: React.FC<DashboardTopProductsProps> = ({ topProducts }) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Top Produk Terlaris</h2>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-300/80 dark:border-slate-700/80">
          {topProducts.length} Produk
        </span>
      </div>

      <div className="space-y-2.5">
        {topProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
            Belum ada data penjualan produk.
          </div>
        ) : (
          topProducts.slice(0, 5).map((product, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60 shrink-0">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{product.product_name}</h4>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{product.total_qty} transaksi</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {formatRupiah(product.total_revenue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
