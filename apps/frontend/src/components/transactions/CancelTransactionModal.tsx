'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Trash2 } from 'lucide-react';

interface CancelTransactionModalProps {
  transaction: any;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const CancelTransactionModal: React.FC<CancelTransactionModalProps> = ({
  transaction,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('Pelanggan membatalkan pesanan');
  const reasonValid = reason.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonValid) return;
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo border border-border-main shadow-2xl rounded-2xl"
      >
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-text-main flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Batalkan Pesanan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {transaction?.invoice_number} • <strong className="text-text-main font-sans">{transaction?.customer_name || 'Pelanggan Umum'}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl text-xs mb-4 border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          Pesanan masih mengantri: reservasi bahan akan dilepas sehingga stok kembali
          tersedia untuk pesanan lain. Uang yang sudah masuk (DP/lunas){' '}
          <strong>tidak otomatis direfund</strong> — proses refund dicatat terpisah
          melalui halaman Riwayat Transaksi.
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            Alasan Pembatalan *
          </label>
          <textarea
            required
            minLength={2}
            maxLength={255}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl text-sm bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 resize-none"
          />
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-xs rounded-xl cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={submitting || !reasonValid}
            className="flex-1 py-2.5 font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {submitting ? 'Membatalkan...' : 'Ya, Batalkan'}
          </button>
        </div>
      </form>
    </div>
  );
};
