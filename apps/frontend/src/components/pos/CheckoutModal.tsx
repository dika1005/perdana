'use client';

import React from 'react';
import { CreditCard, X, Calendar } from 'lucide-react';
import { PaymentStatus } from '../../types/transaction';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  customerName: string;
  paymentStatus: PaymentStatus;
  onPaymentStatusChange: (st: PaymentStatus) => void;
  payAmount: number;
  onPayAmountChange: (val: number) => void;
  estimatedDoneAt: string;
  onEstimatedDoneAtChange: (val: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  total,
  customerName,
  paymentStatus,
  onPaymentStatusChange,
  payAmount,
  onPayAmountChange,
  estimatedDoneAt,
  onEstimatedDoneAtChange,
  submitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-black/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-base text-text-main">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-text-muted">Pelanggan: {customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Total Tagihan Box */}
          <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/50 dark:bg-brand-950/20 flex justify-between items-center">
            <span className="text-xs font-bold text-text-muted">Total Tagihan:</span>
            <span className="text-xl font-black text-brand-600 font-mono">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Status Bayar Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Tipe Pembayaran:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PAID', label: 'Bayar Lunas', desc: 'Lunas 100%' },
                { id: 'DP', label: 'Uang Muka (DP)', desc: 'Sebagian Dulu' },
                { id: 'UNPAID', label: 'Belum Bayar', desc: 'Bayar Saat Ambil' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    const nextSt = st.id as PaymentStatus;
                    onPaymentStatusChange(nextSt);
                    if (nextSt === 'PAID') onPayAmountChange(total);
                    if (nextSt === 'UNPAID') onPayAmountChange(0);
                  }}
                  className={`py-2 px-1 text-center rounded-xl transition-all border ${
                    paymentStatus === st.id 
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40 text-brand-600 font-bold shadow-sm' 
                      : 'border-transparent skeuo-button text-text-muted'
                  }`}
                >
                  <p className="text-xs">{st.label}</p>
                  <p className="text-[9px] opacity-70">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Nominal Bayar */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nominal yang Diterima (Rp):</label>
            <div className="px-4 py-2 skeuo-inset rounded-xl bg-white/40 dark:bg-black/20">
              <input 
                type="number" 
                min="0"
                value={payAmount || ''}
                onChange={e => onPayAmountChange(Number(e.target.value))}
                placeholder="0"
                className="bg-transparent border-none outline-none w-full text-text-main font-black text-lg font-mono"
              />
            </div>

            {/* Quick Cash Suggestions */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => onPayAmountChange(total)}
                className="px-2.5 py-1 text-[10px] font-bold skeuo-button text-brand-600 rounded-lg whitespace-nowrap"
              >
                Uang Pas
              </button>
              {[50000, 100000, 200000, 500000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onPayAmountChange(val)}
                  className="px-2 py-1 text-[10px] font-medium skeuo-button text-text-muted rounded-lg whitespace-nowrap"
                >
                  Rp {(val / 1000).toFixed(0)}rb
                </button>
              ))}
            </div>

            {/* Kembalian / Piutang Alert */}
            {payAmount > total && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex justify-between">
                <span>Kembalian Kasir:</span>
                <span className="font-mono">Rp {(payAmount - total).toLocaleString('id-ID')}</span>
              </div>
            )}
            {payAmount < total && paymentStatus !== 'PAID' && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-xs flex justify-between">
                <span>Sisa Tagihan / DP:</span>
                <span className="font-mono">Rp {(total - payAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* Estimasi Selesai */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Estimasi Selesai Cetak (Opsional):
            </label>
            <input 
              type="date" 
              value={estimatedDoneAt}
              onChange={e => onEstimatedDoneAtChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs text-text-main skeuo-inset rounded-lg outline-none bg-transparent border border-black/10"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
              disabled={submitting}
            >
              Kembali
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs shadow-md disabled:opacity-50 transition-all"
            >
              {submitting ? 'Memproses...' : 'Selesaikan & Cetak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
