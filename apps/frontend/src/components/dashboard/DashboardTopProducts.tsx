'use client';

import React from 'react';
import { TopProductReport } from '../../types/report';

interface DashboardTopProductsProps {
  topProducts: TopProductReport[];
}

export const DashboardTopProducts: React.FC<DashboardTopProductsProps> = ({ topProducts }) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-text-main">Top Produk Terlaris</h2>
        <span className="text-xs text-text-muted">{topProducts.length} Produk</span>
      </div>

      <div className="space-y-4">
        {topProducts.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">
            Belum ada data penjualan produk.
          </div>
        ) : (
          topProducts.slice(0, 5).map((product, idx) => (
            <div key={idx} className="flex items-center gap-4 skeuo-inset p-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg skeuo flex items-center justify-center font-bold text-brand-500 text-sm">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text-main truncate">{product.product_name}</h4>
                <p className="text-xs text-text-muted">{product.total_qty} terjual</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-600">
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
