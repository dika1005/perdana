'use client';

import React from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { ProductAddon } from '../../types/product';
import { formatRupiah } from '../../utils/format';

interface AddonListTabProps {
  addons: ProductAddon[];
  onOpenAddModal: () => void;
  onOpenEditModal: (addon: ProductAddon) => void;
  onDeleteAddon: (id: number) => void;
  onConfigureBom: (addon: ProductAddon) => void;
}

export const AddonListTab: React.FC<AddonListTabProps> = ({
  addons,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteAddon,
  onConfigureBom,
}) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-base font-bold text-text-main">Master Finishing & Add-ons</h2>
          <p className="text-xs text-text-muted">Finishing percetakan: Pita Yasin, Sudut Siku, Mata Ayam, Cutting, Laminasi, dsb.</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Add-on
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-3">Nama Finishing / Add-on</th>
              <th className="pb-3">Kategori Terkait</th>
              <th className="pb-3">Tipe Harga</th>
              <th className="pb-3">Harga</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {addons.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted text-xs">
                  Belum ada opsi finishing / add-on.
                </td>
              </tr>
            ) : (
              addons.map(a => (
                <tr key={a.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                  <td className="py-3 font-bold text-text-main">{a.name}</td>
                  <td className="py-3">
                    {a.category_name ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                        <Layers className="w-3 h-3" />
                        {a.category_name}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Semua Kategori (Global)
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-brand-600">
                      {a.price_type}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-brand-600 font-mono">
                    {a.price_type === 'RANGE' 
                      ? `${formatRupiah(a.min_price)} - ${formatRupiah(a.max_price)}`
                      : formatRupiah(a.default_price)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onConfigureBom(a)}
                        className="w-8 h-8 flex items-center justify-center skeuo-button text-indigo-500 rounded-lg"
                        title="Atur bahan finishing"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenEditModal(a)}
                        className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                        title="Edit add-on"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAddon(a.id)}
                        className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
                        title="Hapus add-on"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
