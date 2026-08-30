'use client';

import React from 'react';
import { Search, Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { formatRupiah } from '../../utils/format';

interface ProductListTabProps {
  products: Product[];
  categories: Category[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onConfigureBom: (product: Product) => void;
}

export const ProductListTab: React.FC<ProductListTabProps> = ({
  products,
  categories,
  searchTerm,
  onSearchChange,
  onSearchKeyDown,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onConfigureBom,
}) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex-1 max-w-md flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-slate-400 font-medium"
          />
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Produk</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Tipe Harga</th>
              <th className="py-3 px-4">Harga Default</th>
              <th className="py-3 px-4">Min. Order</th>
              <th className="py-3 px-4">Varian?</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  Belum ada produk di database.
                </td>
              </tr>
            ) : (
              products.map(p => {
                const cat = categories.find(c => c.id === p.category_id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-xs text-text-main">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{cat?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                        {p.price_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-xs text-text-main font-mono">
                      {formatRupiah(p.default_price)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {p.min_order} {p.unit_name}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {p.has_variants ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ya</span>
                      ) : (
                        <span className="text-slate-400">Tidak</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onConfigureBom(p)}
                          className="p-1.5 skeuo-button text-indigo-600 dark:text-indigo-400 rounded-lg"
                          title="Atur BOM multi-bahan"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 skeuo-button text-blue-600 dark:text-blue-400 rounded-lg"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 skeuo-button text-rose-500 hover:text-rose-600 rounded-lg"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
