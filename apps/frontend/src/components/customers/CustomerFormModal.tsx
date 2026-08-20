'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  name: string;
  onChangeName: (val: string) => void;
  phone: string;
  onChangePhone: (val: string) => void;
  address: string;
  onChangeAddress: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  name,
  onChangeName,
  phone,
  onChangePhone,
  address,
  onChangeAddress,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-text-main">Tambah Pelanggan Baru</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nama Pelanggan *</label>
            <div className="px-4 py-2.5 skeuo-inset rounded-xl">
              <input 
                type="text" 
                required
                value={name}
                onChange={e => onChangeName(e.target.value)}
                placeholder="Contoh: PT. Maju Jaya" 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nomor WhatsApp / Telepon</label>
            <div className="px-4 py-2.5 skeuo-inset rounded-xl">
              <input 
                type="tel" 
                value={phone}
                onChange={e => onChangePhone(e.target.value)}
                placeholder="08123456789" 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Alamat</label>
            <div className="px-4 py-2.5 skeuo-inset rounded-xl">
              <textarea 
                value={address}
                onChange={e => onChangeAddress(e.target.value)}
                placeholder="Jl. Merdeka No. 123" 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main resize-none h-20"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
            disabled={submitting}
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-xs"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
          </button>
        </div>
      </form>
    </div>
  );
};
