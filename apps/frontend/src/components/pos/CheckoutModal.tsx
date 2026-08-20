'use client';

import React from 'react';
import { CreditCard, X, Calendar, Check, Clock, Wallet } from 'lucide-react';
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

  const paymentTypes = [
    { 
      id: 'PAID' as PaymentStatus, 
      label: 'Bayar Lunas', 
      desc: 'Langsung lunas 100%',
      icon: Check,
      activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      iconColor: 'text-emerald-500',
    },
    { 
      id: 'DP' as PaymentStatus, 
      label: 'Uang Muka (DP)', 
      desc: 'Bayar sebagian dulu',
      icon: Wallet,
      activeColor: 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-500',
    },
    { 
      id: 'UNPAID' as PaymentStatus, 
      label: 'Belum Bayar', 
      desc: 'Bayar saat ambil barang',
      icon: Clock,
      activeColor: 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300',
      iconColor: 'text-red-400',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo">
        <div className="flex justify-between items-start mb-5 pb-3 border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-base text-text-main">Pembayaran</h3>
              <p className="text-xs text-text-muted mt-0.5">Pelanggan: <strong>{customerName}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Total Tagihan Box */}
          <div className="p-4 rounded-xl skeuo-inset bg-brand-50/50 dark:bg-brand-950/20 flex justify-between items-center">
            <span className="text-sm font-bold text-text-muted">Total Tagihan:</span>
            <span className="text-2xl font-black text-brand-600 font-mono">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Status Bayar Selector — Larger with icons and color */}
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2">Cara Bayar:</label>
            <div className="grid grid-cols-3 gap-2.5">
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
                    className={`py-3 px-2 text-center rounded-xl transition-all border-2 ${
                      isActive 
                        ? `${st.activeColor} font-bold shadow-sm` 
                        : 'border-transparent skeuo-button text-text-muted hover:text-text-main'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isActive ? st.iconColor : 'text-text-muted'}`} />
                    <p className="text-xs font-bold">{st.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Nominal Bayar */}
          <div>
            <label className="block text-sm font-bold text-text-muted mb-1.5">Uang Diterima (Rp):</label>
            <div className="px-4 py-3 skeuo-inset rounded-xl bg-white/40 dark:bg-black/20">
              <input 
                type="number" 
                min="0"
                value={payAmount || ''}
                onChange={e => onPayAmountChange(Number(e.target.value))}
                placeholder="0"
                className="bg-transparent border-none outline-none w-full text-text-main font-black text-2xl font-mono"
              />
            </div>

            {/* Quick Cash Suggestions */}
            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => onPayAmountChange(total)}
                className="px-3 py-1.5 text-xs font-bold skeuo-button text-brand-600 rounded-lg whitespace-nowrap"
              >
                💰 Uang Pas
              </button>
              {[50000, 100000, 200000, 500000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onPayAmountChange(val)}
                  className="px-3 py-1.5 text-xs font-bold skeuo-button text-text-muted rounded-lg whitespace-nowrap hover:text-text-main"
                >
                  Rp {(val / 1000).toFixed(0)}rb
                </button>
              ))}
            </div>

            {/* Kembalian / Piutang Alert */}
            {payAmount > total && (
              <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex justify-between items-center">
                <span>💵 Kembalian:</span>
                <span className="font-mono text-base">Rp {(payAmount - total).toLocaleString('id-ID')}</span>
              </div>
            )}
            {payAmount < total && paymentStatus !== 'PAID' && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-sm flex justify-between items-center">
                <span>📋 Sisa Tagihan:</span>
                <span className="font-mono text-base">Rp {(total - payAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* Estimasi Selesai */}
          <div>
            <label className="block text-sm font-bold text-text-muted mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Estimasi Selesai Cetak:
            </label>
            <input 
              type="date" 
              value={estimatedDoneAt}
              onChange={e => onEstimatedDoneAtChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-text-main skeuo-inset rounded-xl outline-none bg-transparent border border-black/10"
            />
            <p className="text-[11px] text-text-muted mt-1 opacity-70">Opsional — kapan pesanan selesai dicetak.</p>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold skeuo-button text-text-muted text-sm rounded-xl"
              disabled={submitting}
            >
              Kembali
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-brand-500 hover:from-emerald-600 hover:to-brand-600 text-white text-sm shadow-lg disabled:opacity-50 transition-all"
            >
              {submitting ? 'Memproses...' : '✅ Selesaikan & Cetak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
