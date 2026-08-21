'use client';

import React from 'react';
import { InventoryMutationReport } from '../../types/report';

interface ReportMutationsTabProps {
  mutations: InventoryMutationReport[];
}

export const ReportMutationsTab: React.FC<ReportMutationsTabProps> = ({ mutations }) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-xs text-text-main">Rekapitulasi Mutasi Stok Bahan Baku</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Total kuantitas barang masuk (IN) dan barang keluar (OUT) per item bahan.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Bahan Baku</th>
              <th className="py-3 px-4">Total Masuk (IN)</th>
              <th className="py-3 px-4">Total Keluar (OUT)</th>
              <th className="py-3 px-4">Stok Akhir Fisik</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {mutations.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                  Belum ada data mutasi bahan.
                </td>
              </tr>
            ) : (
              mutations.map(m => (
                <tr key={m.raw_material_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-main text-xs">{m.raw_material_name}</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-xs">+{m.in_qty}</td>
                  <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-semibold font-mono text-xs">-{m.out_qty}</td>
                  <td className="py-3 px-4 font-bold text-text-main font-mono text-xs">{m.current_stock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
