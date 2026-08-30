import React from 'react';
import { X } from 'lucide-react';
import { Product, PriceType } from '../../types/product';
import { Category } from '../../types/category';

interface ProductFormData {
  name: string;
  category_id?: number;
  price_type: PriceType;
  default_price: number;
  min_price: number;
  max_price: number;
  min_order: number;
  unit_name: string;
  has_variants: boolean;
  uses_material: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  item: Product | null;
  categories: Category[];
  formData: ProductFormData;
  onChange: (field: keyof ProductFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  item,
  categories,
  formData,
  onChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-text-main">
            {item ? 'Edit Data Produk' : 'Tambah Produk Baru'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Produk *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="Contoh: Undangan, Buku Yasin, Spanduk /meter"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-text-main text-xs font-medium focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
              <select
                value={formData.category_id || ''}
                onChange={e => onChange('category_id', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-text-main text-xs font-medium focus:border-blue-500"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Satuan Produk</label>
              <input
                type="text"
                value={formData.unit_name}
                onChange={e => onChange('unit_name', e.target.value)}
                placeholder="pcs / meter / lembar / rim / buku"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-text-main text-xs font-medium focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tipe Harga */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">Skema Harga:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChange('price_type', 'FIXED')}
                className={`py-2 px-2 text-center rounded-lg border text-xs font-bold transition-all ${
                  formData.price_type === 'FIXED'
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Harga Tetap
              </button>
              <button
                type="button"
                onClick={() => onChange('price_type', 'RANGE')}
                className={`py-2 px-2 text-center rounded-lg border text-xs font-bold transition-all ${
                  formData.price_type === 'RANGE'
                    ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Rentang (Min-Max)
              </button>
              <button
                type="button"
                onClick={() => onChange('price_type', 'CUSTOM')}
                className={`py-2 px-2 text-center rounded-lg border text-xs font-bold transition-all ${
                  formData.price_type === 'CUSTOM'
                    ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border-teal-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Nego / Kustom
              </button>
            </div>

            {formData.price_type === 'RANGE' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Harga Minimum (Rp)</label>
                  <input
                    type="number"
                    value={formData.min_price || ''}
                    onChange={e => onChange('min_price', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Harga Maksimum (Rp)</label>
                  <input
                    type="number"
                    value={formData.max_price || ''}
                    onChange={e => onChange('max_price', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  {formData.price_type === 'CUSTOM' ? 'Harga Patokan / Estimasi Awal (Rp)' : 'Nominal Harga (Rp)'}
                </label>
                <input
                  type="number"
                  value={formData.default_price || ''}
                  onChange={e => onChange('default_price', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-sm text-blue-600 dark:text-blue-400"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Memakai bahan stok */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.uses_material}
                onChange={e => onChange('uses_material', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-blue-600"
              />
              <span>Memakai Bahan Stok (wajib diisi saat checkout)</span>
            </label>
            <p className="text-[10px] text-slate-400">
              Aktifkan untuk produk yang produksinya memakai bahan stok (kertas, tinta, amplop, dll).
              Operator mengisi sendiri estimasi bahan di POS; stok dikunci saat DP/lunas dan
              dipotong saat pekerjaan masuk PROSES.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold text-slate-600 dark:text-slate-300 text-xs rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </div>
  );
};
