'use client';

import React from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CustomerFormModalProps {
  isOpen: boolean;
  editingCustomer: Customer | null;
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
  editingCustomer,
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

  const isEdit = !!editingCustomer;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo border border-border-main shadow-2xl rounded-2xl">
        <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isEdit ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-text-main">
                {isEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit ? 'Perbarui informasi kontak dan alamat pelanggan.' : 'Simpan identitas pelanggan untuk nota & repeat order.'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Nama Pelanggan / Perusahaan <span className="text-rose-500">*</span>
            </label>
            <div className="px-3.5 py-2.5 skeuo-inset rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <input 
                type="text" 
                required
                value={name}
                onChange={e => onChangeName(e.target.value)}
                placeholder="Contoh: PT. Maju Jaya / Budi Santoso" 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Nomor WhatsApp / Telepon
            </label>
            <div className="px-3.5 py-2.5 skeuo-inset rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <input 
                type="tel" 
                value={phone}
                onChange={e => onChangePhone(e.target.value)}
                placeholder="Contoh: 081234567890" 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Alamat Lengkap / Keterangan
            </label>
            <div className="px-3.5 py-2.5 skeuo-inset rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <textarea 
                value={address}
                onChange={e => onChangeAddress(e.target.value)}
                placeholder="Contoh: Jl. Merdeka No. 123, Blok B" 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main font-medium resize-none h-20 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-xs rounded-xl"
            disabled={submitting}
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Pelanggan')}
          </button>
        </div>
      </form>
    </div>
  );
};
