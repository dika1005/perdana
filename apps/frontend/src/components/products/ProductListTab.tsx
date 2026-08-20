'use client';

import React from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Product } from '../../types/product';
import { Category } from '../../types/category';

interface ProductListTabProps {
  products: Product[];
  categories: Category[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
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
}) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 skeuo-inset">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="bg-transparent border-none outline-none w-full text-sm text-text-main"
          />
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-3">Nama Produk</th>
              <th className="pb-3">Kategori</th>
              <th className="pb-3">Tipe Harga</th>
              <th className="pb-3">Harga Default</th>
              <th className="pb-3">Min. Order</th>
              <th className="pb-3">Varian?</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted text-xs">
                  Belum ada produk di database.
                </td>
              </tr>
            ) : (
              products.map(p => {
                const cat = categories.find(c => c.id === p.category_id);
                return (
                  <tr key={p.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                    <td className="py-3.5 font-bold text-text-main">{p.name}</td>
                    <td className="py-3.5 text-text-muted text-xs">{cat?.name || '-'}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-brand-600">
                        {p.price_type}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-brand-600">
                      Rp {Number(p.default_price).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 text-text-muted text-xs">
                      {p.min_order} {p.unit_name}
                    </td>
                    <td className="py-3.5 text-xs">
                      {p.has_variants ? (
                        <span className="text-emerald-500 font-bold">Ya</span>
                      ) : (
                        <span className="text-text-muted">Tidak</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onOpenEditModal(p)}
                          className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
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
