'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Product, ProductVariant } from '../../types/product';

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
      <div className="skeuo p-6">
        <h2 className="text-base font-bold text-text-main mb-4">Pilih Produk Induk</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p.id)}
              className={`w-full text-left p-3 rounded-xl transition-all font-semibold text-sm ${
                selectedProductId === p.id 
                  ? 'skeuo-inset text-brand-600 font-bold' 
                  : 'skeuo-button text-text-muted hover:text-text-main'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">{p.name}</span>
                {p.has_variants && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-bold">Varian</span>
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
            <h2 className="text-base font-bold text-text-main">
              Daftar Varian: {selectedProduct?.name || '-'}
            </h2>
            <p className="text-xs text-text-muted">Kelola opsi ukuran, ketebalan, atau tipe cetak varian.</p>
          </div>
          <button
            onClick={onOpenAddModal}
            disabled={!selectedProductId}
            className="flex items-center gap-2 px-4 py-2 font-bold skeuo-button text-brand-600 text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Tambah Varian
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                <th className="pb-3">Nama Varian</th>
                <th className="pb-3">Tipe Harga</th>
                <th className="pb-3">Harga</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted text-xs">
                    Produk ini belum memiliki varian. Klik 'Tambah Varian' di atas.
                  </td>
                </tr>
              ) : (
                variants.map(v => (
                  <tr key={v.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                    <td className="py-3 font-bold text-text-main">{v.variant_name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-brand-600">
                        {v.price_type}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-brand-600">
                      {v.price_type === 'RANGE' 
                        ? `Rp ${Number(v.min_price).toLocaleString('id-ID')} - ${Number(v.max_price).toLocaleString('id-ID')}`
                        : `Rp ${Number(v.price).toLocaleString('id-ID')}`}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onOpenEditModal(v)}
                          className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteVariant(v.id)}
                          className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
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
