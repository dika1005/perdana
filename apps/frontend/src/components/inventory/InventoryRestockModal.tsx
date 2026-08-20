'use client';

import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { RawMaterial } from '../../types/rawMaterial';

interface InventoryRestockModalProps {
  isOpen: boolean;
  selectedItem: RawMaterial | null;
  mutationQty: number;
  onChangeQty: (val: number) => void;
  mutationNotes: string;
  onChangeNotes: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const InventoryRestockModal: React.FC<InventoryRestockModalProps> = ({
  isOpen,
  selectedItem,
  mutationQty,
  onChangeQty,
  mutationNotes,
  onChangeNotes,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-bold text-text-main">Restock Bahan Baku (IN)</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-text-muted text-sm mb-6">Tambahkan stok untuk <strong>{selectedItem.name}</strong></p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Jumlah Mutasi IN ({selectedItem.unit})</label>
            <div className="flex items-center gap-3 px-4 py-3 skeuo-inset rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              <input 
                type="number" 
                min="1"
                value={mutationQty}
                onChange={e => onChangeQty(Number(e.target.value))}
                placeholder="Contoh: 10" 
                className="bg-transparent border-none outline-none w-full text-text-main font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Keterangan / Catatan</label>
            <div className="flex items-center gap-3 px-4 py-3 skeuo-inset rounded-xl h-24 items-start">
              <textarea 
                value={mutationNotes}
                onChange={e => onChangeNotes(e.target.value)}
                placeholder="Contoh: Kulakan dari supplier..." 
                className="bg-transparent border-none outline-none w-full text-text-main resize-none h-full text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3 font-bold skeuo-button text-text-muted text-sm rounded-xl"
            disabled={submitting}
          >
            Batal
          </button>
          <button 
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-3 font-bold skeuo-button text-brand-600 text-sm rounded-xl"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Stok'}
          </button>
        </div>
      </div>
    </div>
  );
};
