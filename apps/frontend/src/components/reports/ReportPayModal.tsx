'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ReceivableItem } from '../../types/report';

interface ReportPayModalProps {
  isOpen: boolean;
  item: ReceivableItem | null;
  payAmount: number;
  onChangeAmount: (val: number) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ReportPayModal: React.FC<ReportPayModalProps> = ({
  isOpen,
  item,
  payAmount,
  onChangeAmount,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-main">Pelunasan Tagihan DP</h2>
            <p className="text-xs text-text-muted">{item.invoice_number} • {item.customer_name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl skeuo-inset bg-amber-50/40 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between text-text-muted">
            <span>Total Belanja:</span>
            <span className="font-bold">Rp {Number(item.total_amount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Telah Dibayar Sebelumnya (DP):</span>
            <span className="font-bold">Rp {Number(item.pay_amount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-black/5">
            <span>Sisa Tagihan:</span>
            <span>Rp {Number(item.remaining_amount).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nominal Pelunasan Diterima (Rp) *</label>
            <input
              type="number"
              required
              min="1"
              value={payAmount}
              onChange={e => onChangeAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold text-base"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm rounded-xl"
          >
            {submitting ? 'Memproses...' : 'Konfirmasi Lunas'}
          </button>
        </div>
      </form>
    </div>
  );
};
