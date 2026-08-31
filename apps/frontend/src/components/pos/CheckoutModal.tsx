'use client';

import React from 'react';
import { CreditCard, X, Calendar, Check, Clock, Wallet } from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  customerName: string;
  paymentStatus: PaymentStatus;
  onPaymentStatusChange: (st: PaymentStatus) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (pm: PaymentMethod) => void;
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
  paymentMethod,
  onPaymentMethodChange,
  payAmount,
  onPayAmountChange,
  estimatedDoneAt,
  onEstimatedDoneAtChange,
  submitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'CASH' as PaymentMethod,
      label: 'Tunai',
      emoji: '💵',
      activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20',
    },
    {
      id: 'QRIS' as PaymentMethod,
      label: 'QRIS',
      emoji: '📱',
      activeColor: 'border-blue-500 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20',
    },
    {
      id: 'TRANSFER' as PaymentMethod,
      label: 'Transfer',
      emoji: '🏦',
      activeColor: 'border-purple-500 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20',
    },
  ];

  const paymentTypes = [
    { 
      id: 'PAID' as PaymentStatus, 
      label: 'Lunas', 
      icon: Check,
      activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20',
    },
    { 
      id: 'DP' as PaymentStatus, 
      label: 'Uang Muka (DP)', 
      icon: Wallet,
      activeColor: 'border-amber-500 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20',
    },
    { 
      id: 'UNPAID' as PaymentStatus, 
      label: 'Belum Bayar', 
      icon: Clock,
      activeColor: 'border-rose-500 bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="p-6 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl my-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pelanggan: <strong className="text-text-main">{customerName}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Total Tagihan Box */}
          <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Tagihan:</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatRupiah(total)}
            </span>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Metode Bayar:</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => {
                const isActive = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => onPaymentMethodChange(pm.id)}
                    className={`py-2 px-2 text-center rounded-xl transition-all border ${
                      isActive 
                        ? `${pm.activeColor} font-bold shadow-xs` 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base block mb-0.5">{pm.emoji}</span>
                    <p className="text-xs font-bold">{pm.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skema Pembayaran (Lunas vs DP vs Belum Bayar) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Status Pembayaran:</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentTypes.map(st => {
                const Icon = st.icon;
                const isActive = paymentStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onPaymentStatusChange(st.id);
                      if (st.id === 'PAID') onPayAmountChange(total);
                      if (st.id === 'UNPAID') onPayAmountChange(0);
                    }}
                    className={`py-2 px-2 text-center rounded-xl transition-all border ${
                      isActive 
                        ? `${st.activeColor} font-bold shadow-xs` 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-xs font-bold">{st.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nominal Bayar */}
          {paymentStatus !== 'UNPAID' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {paymentStatus === 'DP' ? 'Nominal Uang Muka / DP (Rp):' : 'Nominal Dibayar (Rp):'}
                </label>
                <button
                  type="button"
                  onClick={() => onPayAmountChange(total)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Bayar Uang Pas
                </button>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 flex items-center gap-2">
                <span className="font-bold text-slate-400 text-sm">Rp</span>
                <input
                  type="text"
                  value={payAmount > 0 ? payAmount.toLocaleString('id-ID') : ''}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, '');
                    onPayAmountChange(Math.min(clean ? parseInt(clean, 10) : 0, total));
                  }}
                  placeholder="0"
                  className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 font-black text-xl font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Maksimal sebesar total tagihan; kembalian dihitung manual di luar sistem.
              </p>

              {payAmount < total && paymentStatus === 'DP' && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex justify-between items-center">
                  <span>📋 Sisa Tagihan (Pelunasan Nanti):</span>
                  <span className="font-mono text-sm font-black">{formatRupiah(total - payAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Estimasi Selesai (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Target Selesai / Siap Ambil (Opsional):</span>
            </label>
            <input 
              type="date" 
              value={estimatedDoneAt}
              onChange={e => onEstimatedDoneAtChange(e.target.value)}
              className="w-full px-3 py-2 text-xs text-text-main rounded-lg outline-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-bold text-slate-600 dark:text-slate-300 text-xs rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              disabled={submitting}
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Memproses...' : 'Proses & Cetak Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
