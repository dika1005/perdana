'use client';

import React from 'react';
import { Check, Wallet } from 'lucide-react';
import { ExpenseCategory, ExpenseItem, ExpensePaymentMethod } from '../../types/expense';
import { Modal, Button } from '../shared';

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
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingExpense ? 'Edit Pengeluaran' : 'Catat Kas Keluar / Pengeluaran Baru'}
      subtitle="Masukkan data biaya operasional atau belanja bahan toko."
      icon={<Wallet className="w-5 h-5" />}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={formSubmitting} className="flex-1">
            <Check className="w-4 h-4" />
            {formSubmitting ? 'Menyimpan...' : (editingExpense ? 'Simpan Perubahan' : 'Catat Kas Keluar')}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
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
      </div>
    </Modal>
  );
};
