'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

interface TrackingSettleModalProps {
  isOpen: boolean;
  job: any | null;
  payAmount: number;
  onPayAmountChange: (val: number) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TrackingSettleModal: React.FC<TrackingSettleModalProps> = ({
  isOpen,
  job,
  payAmount,
  onPayAmountChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !job) return null;

  const totalAmount = Number(job.total_amount) || 0;
  const currentPaid = Number(job.pay_amount) || 0;
  const remaining = totalAmount - currentPaid;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md bg-bg-skeuo">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-main">Pelunasan & Serahkan Pesanan</h2>
            <p className="text-xs text-text-muted">{job.invoice_number} • {job.customer_name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl skeuo-inset bg-brand-50/40 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between text-text-muted">
            <span>Total Belanja:</span>
            <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Telah Dibayar (DP):</span>
            <span className="font-bold">Rp {currentPaid.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-black/5">
            <span>Sisa Tagihan:</span>
            <span>Rp {remaining.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nominal Pelunasan Diterima (Rp) *</label>
            <input
              type="number"
              required
              min="0"
              value={payAmount}
              onChange={e => onPayAmountChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold text-base bg-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-xs flex items-center justify-center gap-1.5 rounded-xl"
          >
            <Check className="w-4 h-4" />
            {submitting ? 'Menyimpan...' : 'Lunasi & Serahkan'}
          </button>
        </div>
      </form>
    </div>
  );
};
