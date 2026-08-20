'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ProductVariant, RangePriceType } from '../../types/product';

interface VariantFormData {
  variant_name: string;
  price_type: RangePriceType;
  price: number;
  min_price: number;
  max_price: number;
}

interface VariantFormModalProps {
  isOpen: boolean;
  item: ProductVariant | null;
  formData: VariantFormData;
  onChange: (field: keyof VariantFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const VariantFormModal: React.FC<VariantFormModalProps> = ({
  isOpen,
  item,
  formData,
  onChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-text-main">
            {item ? 'Edit Varian' : 'Tambah Varian Baru'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nama Varian *</label>
            <input
              type="text"
              required
              value={formData.variant_name}
              onChange={e => onChange('variant_name', e.target.value)}
              placeholder="Contoh: Glossy 260gr / Ukuran A3+"
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Tipe Harga</label>
            <select
              value={formData.price_type}
              onChange={e => onChange('price_type', e.target.value as RangePriceType)}
              className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium"
            >
              <option value="FIXED">FIXED (Harga Tetap)</option>
              <option value="RANGE">RANGE (Rentang)</option>
            </select>
          </div>

          {formData.price_type === 'FIXED' ? (
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Harga Varian (Rp)</label>
              <input
                type="number"
                value={formData.price}
                onChange={e => onChange('price', Number(e.target.value))}
                className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Min. Harga (Rp)</label>
                <input
                  type="number"
                  value={formData.min_price}
                  onChange={e => onChange('min_price', Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Max. Harga (Rp)</label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={e => onChange('max_price', Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>
            </div>
          )}
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
            {submitting ? 'Menyimpan...' : 'Simpan Varian'}
          </button>
        </div>
      </form>
    </div>
  );
};
