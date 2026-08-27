import React from 'react';
import { X, Check } from 'lucide-react';
import { PaymentMethod } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';

interface TransactionSettleModalProps {
  isOpen: boolean;
  item: any | null;
  payAmount: number;
  onPayAmountChange: (val: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (pm: PaymentMethod) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TransactionSettleModal: React.FC<TransactionSettleModalProps> = ({
  isOpen,
  item,
  payAmount,
  onPayAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !item) return null;

  const total = Number(item.total_amount) || 0;
  const alreadyPaid = Number(item.pay_amount) || 0;
  const remaining = total - alreadyPaid;

  const paymentMethods = [
    {
      id: 'CASH' as PaymentMethod,
      label: 'Tunai (Cash)',
      emoji: '💵',
      activeColor: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20',
    },
    {
      id: 'QRIS' as PaymentMethod,
      label: 'QRIS',
      emoji: '📱',
      activeColor: 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20',
    },
    {
      id: 'TRANSFER' as PaymentMethod,
      label: 'Transfer',
      emoji: '🏦',
      activeColor: 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo border border-border-main shadow-2xl rounded-2xl">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-text-main">Pelunasan Tagihan DP</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{item.invoice_number} • <strong className="text-text-main font-sans">{item.customer_name}</strong></p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/40 dark:bg-brand-950/40 text-xs space-y-1.5 mb-4 border border-brand-200/50 dark:border-brand-800/50">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Total Belanja:</span>
            <span className="font-bold text-text-main">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Sudah Masuk (DP):</span>
            <span className="font-bold">{formatRupiah(alreadyPaid)} <span className="text-[10px] font-mono opacity-80">({item.payment_method || 'CASH'})</span></span>
          </div>
          <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Sisa Kurang Bayar:</span>
            <span className="font-mono">{formatRupiah(remaining)}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pilih Metode Bayar Pelunasan */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Metode Pembayaran Pelunasan:
            </label>
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
                        ? `${pm.activeColor} font-bold shadow-xs` 
                        : 'border-slate-200 dark:border-slate-800 skeuo-button text-slate-600 dark:text-slate-400 hover:text-text-main'
                    }`}
                  >
                    <span className="text-base block mb-0.5">{pm.emoji}</span>
                    <p className="text-xs font-bold">{pm.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Nominal Bayar Pelunasan (Rp) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={payAmount || ''}
              onChange={e => onPayAmountChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold text-base bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
            />
          </div>

          {payAmount > remaining && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex justify-between border border-emerald-200 dark:border-emerald-800">
              <span>Kembalian:</span>
              <span className="font-mono">{formatRupiah(payAmount - remaining)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-xs rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {submitting ? 'Menyimpan...' : 'Simpan Pelunasan'}
          </button>
        </div>
      </form>
    </div>
  );
};
