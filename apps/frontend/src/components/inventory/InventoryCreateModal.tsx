'use client';

import React from 'react';
import { X } from 'lucide-react';

interface InventoryCreateFormData {
  name: string;
  variant: string;
  unit: string;
  stock: number;
  min_stock_warning: number;
  category_id?: number;
}

interface InventoryCreateModalProps {
  isOpen: boolean;
  formData: InventoryCreateFormData;
  onChange: (field: keyof InventoryCreateFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InventoryCreateModal: React.FC<InventoryCreateModalProps> = ({
  isOpen,
  formData,
  onChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-text-main">Tambah Bahan Baku Baru</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nama Bahan *</label>
            <div className="px-4 py-2.5 skeuo-inset rounded-xl">
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => onChange('name', e.target.value)}
                placeholder="Contoh: Kertas Art Paper 260gr" 
                className="bg-transparent border-none outline-none w-full text-text-main text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Varian (Opsional)</label>
            <div className="px-4 py-2.5 skeuo-inset rounded-xl">
              <input 
                type="text" 
                value={formData.variant}
                onChange={e => onChange('variant', e.target.value)}
                placeholder="Contoh: A3+ / Roll" 
                className="bg-transparent border-none outline-none w-full text-text-main text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Satuan</label>
              <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                <input 
                  type="text" 
                  value={formData.unit}
                  onChange={e => onChange('unit', e.target.value)}
                  placeholder="pcs / rim / liter" 
                  className="bg-transparent border-none outline-none w-full text-text-main text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Stok Awal</label>
              <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                <input 
                  type="number" 
                  value={formData.stock}
                  onChange={e => onChange('stock', Number(e.target.value))}
                  className="bg-transparent border-none outline-none w-full text-text-main font-bold text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Peringatan Stok Minimum</label>
            <div className="px-4 py-2.5 skeuo-inset rounded-xl">
              <input 
                type="number" 
                value={formData.min_stock_warning}
                onChange={e => onChange('min_stock_warning', Number(e.target.value))}
                className="bg-transparent border-none outline-none w-full text-text-main font-bold text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 font-bold skeuo-button text-text-muted text-sm rounded-xl"
            disabled={submitting}
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 font-bold skeuo-button text-brand-600 text-sm rounded-xl"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Bahan'}
          </button>
        </div>
      </form>
    </div>
  );
};
