import React from 'react';
import { X, Layers } from 'lucide-react';
import { Product, PriceType } from '../../types/product';
import { Category } from '../../types/category';
import { RawMaterial } from '../../types/rawMaterial';

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
  raw_material_id?: number;
  material_amount?: number;
}

interface ProductFormModalProps {
  isOpen: boolean;
  item: Product | null;
  categories: Category[];
  rawMaterials?: RawMaterial[];
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
  rawMaterials = [],
  formData,
  onChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-text-main">
            {item ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nama Produk *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="Contoh: Banner Flexi 280gr"
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Kategori Produk</label>
            <select
              value={formData.category_id || ''}
              onChange={e => onChange('category_id', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
            >
              <option value="">Tanpa Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* BOM: Hubungkan ke Bahan Baku Inventaris */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600">
              <Layers className="w-4 h-4" />
              <span>Resep Bahan Baku (Auto-Deduct Stok)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Bahan Baku Terkait</label>
                <select
                  value={formData.raw_material_id || ''}
                  onChange={e => onChange('raw_material_id', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 skeuo outline-none text-xs text-text-main rounded-lg bg-transparent"
                >
                  <option value="">-- Tidak Terhubung --</option>
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit}) - Stok: {m.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Konsumsi per Unit / m²</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={formData.material_amount !== undefined ? formData.material_amount : 1}
                  onChange={e => onChange('material_amount', Number(e.target.value))}
                  placeholder="1.0"
                  className="w-full px-3 py-2 skeuo-inset outline-none text-xs text-text-main rounded-lg font-bold"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Stok bahan di modul Inventaris otomatis berkurang saat pesanan produk ini dibuat.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tipe Harga</label>
              <select
                value={formData.price_type}
                onChange={e => onChange('price_type', e.target.value as PriceType)}
                className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
              >
                <option value="FIXED">FIXED (Harga Tetap)</option>
                <option value="RANGE">RANGE (Rentang)</option>
                <option value="CUSTOM">CUSTOM (Fleksibel / Meteran)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Harga Default (Rp)</label>
              <input
                type="number"
                value={formData.default_price}
                onChange={e => onChange('default_price', Number(e.target.value))}
                className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold"
              />
            </div>
          </div>

          {formData.price_type === 'RANGE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Harga Minimum (Rp)</label>
                <input
                  type="number"
                  value={formData.min_price}
                  onChange={e => onChange('min_price', Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Harga Maksimum (Rp)</label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={e => onChange('max_price', Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Min. Order</label>
              <input
                type="number"
                min="1"
                value={formData.min_order}
                onChange={e => onChange('min_order', Number(e.target.value))}
                className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Satuan</label>
              <input
                type="text"
                value={formData.unit_name}
                onChange={e => onChange('unit_name', e.target.value)}
                placeholder="pcs / meter / rim / lembar"
                className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="has_variants"
              checked={formData.has_variants}
              onChange={e => onChange('has_variants', e.target.checked)}
              className="w-4 h-4 rounded text-brand-600"
            />
            <label htmlFor="has_variants" className="text-xs font-semibold text-text-main cursor-pointer">
              Produk memiliki varian ukuran/tipe berbeda
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </div>
  );
};
