'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ProductAddon, RangePriceType } from '../../types/product';

interface AddonFormData {
  name: string;
  price_type: RangePriceType;
  default_price: number;
  min_price: number;
  max_price: number;
}

interface AddonFormModalProps {
  isOpen: boolean;
  item: ProductAddon | null;
  formData: AddonFormData;
  onChange: (field: keyof AddonFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddonFormModal: React.FC<AddonFormModalProps> = ({
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
            {item ? 'Edit Add-on' : 'Tambah Add-on / Finishing'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nama Finishing *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="Contoh: Laminasi Doff / Spot UV"
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
              <label className="block text-xs font-semibold text-text-muted mb-1">Tarif Finishing (Rp)</label>
              <input
                type="number"
                value={formData.default_price}
                onChange={e => onChange('default_price', Number(e.target.value))}
                className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Min. Tarif (Rp)</label>
                <input
                  type="number"
                  value={formData.min_price}
                  onChange={e => onChange('min_price', Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Max. Tarif (Rp)</label>
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
            {submitting ? 'Menyimpan...' : 'Simpan Add-on'}
          </button>
        </div>
      </form>
    </div>
  );
};
