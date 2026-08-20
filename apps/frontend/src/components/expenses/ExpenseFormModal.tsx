'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { ExpenseCategory, ExpenseItem, ExpensePaymentMethod } from '../../types/expense';

interface ExpenseFormData {
  title: string;
  category: ExpenseCategory;
  amount: string;
  payment_method: ExpensePaymentMethod;
  notes: string;
  expense_date: string;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  editingExpense: ExpenseItem | null;
  formData: ExpenseFormData;
  formSubmitting: boolean;
  onChange: (field: keyof ExpenseFormData, value: any) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  editingExpense,
  formData,
  formSubmitting,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-7 w-full max-w-lg bg-bg-skeuo max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-black/10">
          <div>
            <h3 className="font-bold text-base text-text-main">
              {editingExpense ? 'Edit Pengeluaran' : 'Catat Kas Keluar / Pengeluaran Baru'}
            </h3>
            <p className="text-xs text-text-muted">Masukkan data biaya operasional atau belanja bahan toko.</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Judul / Keterangan */}
          <div>
            <label className="block font-semibold text-text-muted mb-1">
              Keterangan Pengeluaran *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Beli 1 Roll Flexi 280g, Token Listrik, Service Wiper..."
              value={formData.title}
              onChange={e => onChange('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
            />
          </div>

          {/* Kategori & Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text-muted mb-1">Kategori Pengeluaran *</label>
              <select
                value={formData.category}
                onChange={e => onChange('category', e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
              >
                <option value="BAHAN_BAKU">Bahan Baku & Tinta</option>
                <option value="OPERASIONAL">Operasional Harian</option>
                <option value="MAINTENANCE">Maintenance Mesin</option>
                <option value="GAJI">Gaji & Upah Operator</option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text-muted mb-1">Nominal Biaya (Rp) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="0"
                value={formData.amount}
                onChange={e => onChange('amount', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs font-bold text-red-500 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Metode Bayar & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text-muted mb-1">Metode Pembayaran *</label>
              <select
                value={formData.payment_method}
                onChange={e => onChange('payment_method', e.target.value as ExpensePaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
              >
                <option value="CASH">Tunai (Kas Laci)</option>
                <option value="TRANSFER">Transfer Bank Toko</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-text-muted mb-1">Waktu / Tanggal Biaya *</label>
              <input
                type="datetime-local"
                required
                value={formData.expense_date}
                onChange={e => onChange('expense_date', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block font-semibold text-text-muted mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Contoh: No. Nota supplier #8821, Toko Sumber Makmur..."
              value={formData.notes}
              onChange={e => onChange('notes', e.target.value)}
              className="w-full p-3 rounded-xl skeuo-inset text-xs text-text-main outline-none resize-none bg-transparent"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="flex-1 py-2.5 font-bold skeuo-button-primary bg-brand-500 hover:bg-brand-600 text-white text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {formSubmitting ? 'Menyimpan...' : (editingExpense ? 'Simpan Perubahan' : 'Catat Kas Keluar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
