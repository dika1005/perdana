'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';
import { formatRupiah } from '../../utils/format';
import { Button } from '../shared';

interface VariantListTabProps {
  products: Product[];
  selectedProductId: number | null;
  onSelectProduct: (id: number) => void;
  variants: ProductVariant[];
  onOpenAddModal: () => void;
  onOpenEditModal: (variant: ProductVariant) => void;
  onDeleteVariant: (id: number) => void;
}

export const VariantListTab: React.FC<VariantListTabProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  variants,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteVariant,
}) => {
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Produk Induk */}
      <div className="skeuo p-5">
        <h2 className="text-xs font-bold text-text-main mb-3">Pilih Produk Induk</h2>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p.id)}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all text-xs ${
                selectedProductId === p.id 
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">{p.name}</span>
                {p.has_variants && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Varian</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Varian */}
      <div className="lg:col-span-2 skeuo p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xs font-bold text-text-main">
              Daftar Varian: {selectedProduct?.name || '-'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Kelola opsi ukuran, ketebalan, atau tipe cetak varian.</p>
          </div>
          <Button variant="primary" size="sm" onClick={onOpenAddModal} disabled={!selectedProductId}>
            <Plus className="w-3.5 h-3.5" />
            Tambah Varian
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nama Varian</th>
                <th className="py-3 px-4">Tipe Harga</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                    Produk ini belum memiliki varian. Klik &apos;Tambah Varian&apos; di atas.
                  </td>
                </tr>
              ) : (
                variants.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-xs text-text-main">{v.variant_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                        {v.price_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-xs text-text-main font-mono">
                      {v.price_type === 'RANGE' 
                        ? `${formatRupiah(v.min_price)} - ${formatRupiah(v.max_price)}`
                        : formatRupiah(v.price)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onOpenEditModal(v)}
                          className="p-1.5 skeuo-button text-blue-600 dark:text-blue-400 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteVariant(v.id)}
                          className="p-1.5 skeuo-button text-rose-500 hover:text-rose-600 rounded-lg"
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
    </div>
  );
};
