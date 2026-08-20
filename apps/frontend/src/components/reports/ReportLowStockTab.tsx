'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { LowStockItem } from '../../types/report';

interface ReportLowStockTabProps {
  lowStock: LowStockItem[];
}

export const ReportLowStockTab: React.FC<ReportLowStockTabProps> = ({ lowStock }) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-base text-text-main">Peringatan Bahan Baku Kritis / Menipis</h3>
          <p className="text-xs text-text-muted">Bahan dengan stok fisik ≤ batas minimum yang perlu segera direstock.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-3">Nama Bahan Baku</th>
              <th className="pb-3">Varian</th>
              <th className="pb-3">Satuan</th>
              <th className="pb-3">Stok Saat Ini</th>
              <th className="pb-3">Batas Minimum</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {lowStock.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                  Seluruh stok bahan baku dalam kondisi aman.
                </td>
              </tr>
            ) : (
              lowStock.map(l => (
                <tr key={l.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                  <td className="py-3.5 font-bold text-text-main text-xs">{l.name}</td>
                  <td className="py-3.5 text-text-muted text-xs">{l.variant || '-'}</td>
                  <td className="py-3.5 text-text-muted text-xs">{l.unit}</td>
                  <td className="py-3.5 font-bold text-red-500 text-sm">{l.stock} {l.unit}</td>
                  <td className="py-3.5 text-text-muted text-xs">{l.min_stock_warning} {l.unit}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold text-red-500 bg-red-50 skeuo-inset flex items-center gap-1 w-max">
                      <AlertTriangle className="w-3 h-3" /> Kritis / Perlu Restock
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
