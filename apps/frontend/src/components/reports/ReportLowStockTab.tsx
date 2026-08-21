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
          <h3 className="font-bold text-xs text-text-main">Peringatan Bahan Baku Kritis / Menipis</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Bahan dengan stok fisik ≤ batas minimum yang perlu segera direstock.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Bahan Baku</th>
              <th className="py-3 px-4">Varian</th>
              <th className="py-3 px-4">Satuan</th>
              <th className="py-3 px-4">Stok Saat Ini</th>
              <th className="py-3 px-4">Batas Minimum</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {lowStock.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                  Seluruh stok bahan baku dalam kondisi aman.
                </td>
              </tr>
            ) : (
              lowStock.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-main text-xs">{l.name}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{l.variant || '-'}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{l.unit}</td>
                  <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400 font-mono text-xs">{l.stock} {l.unit}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{l.min_stock_warning} {l.unit}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Perlu Restock
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
