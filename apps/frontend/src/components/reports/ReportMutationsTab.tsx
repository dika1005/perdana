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
          <h3 className="font-bold text-base text-text-main">Rekapitulasi Mutasi Stok Bahan Baku</h3>
          <p className="text-xs text-text-muted">Total kuantitas barang masuk (IN) dan barang keluar (OUT) per item bahan.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-3">Nama Bahan Baku</th>
              <th className="pb-3">Total Masuk (IN)</th>
              <th className="pb-3">Total Keluar (OUT)</th>
              <th className="pb-3">Stok Akhir Fisik</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {mutations.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted text-xs">
                  Belum ada data mutasi bahan.
                </td>
              </tr>
            ) : (
              mutations.map(m => (
                <tr key={m.raw_material_id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                  <td className="py-3.5 font-bold text-text-main text-xs">{m.raw_material_name}</td>
                  <td className="py-3.5 text-emerald-600 font-bold text-xs">+{m.in_qty}</td>
                  <td className="py-3.5 text-red-500 font-bold text-xs">-{m.out_qty}</td>
                  <td className="py-3.5 font-bold text-text-main text-sm">{m.current_stock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
