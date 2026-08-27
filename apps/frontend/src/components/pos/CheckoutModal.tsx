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
      label: 'Tunai (Cash)',
      desc: 'Uang fisik laci',
      emoji: '💵',
      activeColor: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20',
    },
    {
      id: 'QRIS' as PaymentMethod,
      label: 'QRIS',
      desc: 'Scan digital / QR',
      emoji: '📱',
      activeColor: 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20',
    },
    {
      id: 'TRANSFER' as PaymentMethod,
      label: 'Transfer Bank',
      desc: 'Mutasi rekening',
      emoji: '🏦',
      activeColor: 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20',
    },
  ];

  const paymentTypes = [
    { 
      id: 'PAID' as PaymentStatus, 
      label: 'Bayar Lunas', 
      desc: 'Langsung lunas 100%',
      icon: Check,
      activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    { 
      id: 'DP' as PaymentStatus, 
      label: 'Uang Muka (DP)', 
      desc: 'Bayar sebagian dulu',
      icon: Wallet,
      activeColor: 'border-amber-500 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    { 
      id: 'UNPAID' as PaymentStatus, 
      label: 'Belum Bayar', 
      desc: 'Bayar saat ambil barang',
      icon: Clock,
      activeColor: 'border-red-500 bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 ring-2 ring-red-500/20',
      iconColor: 'text-red-500 dark:text-red-400',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo border border-border-main shadow-2xl my-auto">
        <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h3 className="font-bold text-base text-text-main">Proses Pembayaran</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pelanggan: <strong className="text-text-main">{customerName}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Total Tagihan Box */}
          <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/80 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Tagihan:</span>
            <span className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
              {formatRupiah(total)}
            </span>
          </div>

          {/* Metode Pembayaran (Cash vs QRIS vs Transfer) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Metode Pembayaran:</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => {
                const isActive = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => onPaymentMethodChange(pm.id)}
                    className={`py-2.5 px-2 text-center rounded-xl transition-all border-2 ${
                      isActive 
                        ? `${pm.activeColor} font-bold shadow-sm` 
                        : 'border-slate-200 dark:border-slate-800 skeuo-button text-slate-600 dark:text-slate-400 hover:text-text-main'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{pm.emoji}</span>
                    <p className="text-xs font-bold">{pm.label}</p>
                    <p className="text-[9px] opacity-75 mt-0.5">{pm.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Bayar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Skema Pembayaran:</label>
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
                    className={`py-2.5 px-2 text-center rounded-xl transition-all border-2 ${
                      isActive 
                        ? `${st.activeColor} font-bold shadow-sm` 
                        : 'border-slate-200 dark:border-slate-800 skeuo-button text-slate-600 dark:text-slate-400 hover:text-text-main'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${isActive ? st.iconColor : 'text-slate-400 dark:text-slate-500'}`} />
                    <p className="text-xs font-bold">{st.label}</p>
                    <p className="text-[9px] opacity-75 mt-0.5">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Nominal Bayar */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Uang Diterima / DP Masuk (Rp):</label>
            <div className="px-4 py-3 skeuo-inset rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
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
                className="px-3 py-1.5 text-xs font-bold skeuo-button text-brand-600 dark:text-brand-400 rounded-lg whitespace-nowrap bg-brand-50/80 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800"
              >
                💰 Uang Pas
              </button>
              {[50000, 100000, 200000, 500000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onPayAmountChange(val)}
                  className="px-3 py-1.5 text-xs font-bold skeuo-button text-slate-600 dark:text-slate-400 rounded-lg whitespace-nowrap hover:text-text-main"
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>

            {/* Kembalian / Piutang Alert */}
            {payAmount > total && (
              <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-sm flex justify-between items-center">
                <span>💵 Uang Kembalian:</span>
                <span className="font-mono text-base font-black">{formatRupiah(payAmount - total)}</span>
              </div>
            )}
            {payAmount < total && paymentStatus !== 'PAID' && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-sm flex justify-between items-center">
                <span>📋 Sisa Tagihan (Piutang):</span>
                <span className="font-mono text-base font-black">{formatRupiah(total - payAmount)}</span>
              </div>
            )}
          </div>

          {/* Estimasi Selesai */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" /> Estimasi Selesai Cetak:
            </label>
            <input 
              type="date" 
              value={estimatedDoneAt}
              onChange={e => onEstimatedDoneAtChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-text-main skeuo-inset rounded-xl outline-none bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-medium"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Opsional — tanggal pesanan siap diambil.</p>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-sm rounded-xl"
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
