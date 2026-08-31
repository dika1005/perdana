'use client';

import React, { useState } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { PaymentMethod } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';

export interface RefundPayload {
  amount: number;
  paymentMethod: PaymentMethod;
  reason: string;
  referenceNo?: string;
}

interface RefundTransactionModalProps {
  transaction: any;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: RefundPayload) => void;
}

export const RefundTransactionModal: React.FC<RefundTransactionModalProps> = ({
  transaction,
  submitting,
  onClose,
  onSubmit,
}) => {
  const refundable = Number(transaction?.paid_amount ?? transaction?.pay_amount) || 0;
  const [amount, setAmount] = useState<number>(refundable);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reason, setReason] = useState('Pengembalian uang pelanggan');
  const [referenceNo, setReferenceNo] = useState('');

  const valid = amount > 0 && amount <= refundable && reason.trim().length >= 2;

  const paymentMethods = [
    {
      id: 'CASH' as PaymentMethod,
      label: 'Tunai',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      amount,
      paymentMethod,
      reason: reason.trim(),
      referenceNo: referenceNo.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <form
        onSubmit={handleSubmit}
        className="skeuo p-6 sm:p-7 w-full max-w-md bg-bg-skeuo border border-border-main shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-text-main flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-500" />
              Proses Refund Pelanggan
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
          Refund maksimal sebesar uang yang tercatat di sistem ({formatRupiah(refundable)}).
          Tindakan ini tercatat di ledger beserta nama Anda dan alasannya.
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nominal Refund (Rp) *</label>
              <button
                type="button"
                onClick={() => setAmount(refundable)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Refund Penuh
              </button>
            </div>
            <div className="px-3.5 py-2 rounded-xl skeuo-inset bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 flex items-center gap-2">
              <span className="font-bold text-slate-400 text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                onChange={e => {
                  const clean = e.target.value.replace(/\D/g, '');
                  setAmount(Math.min(clean ? parseInt(clean, 10) : 0, refundable));
                }}
                placeholder="0"
                className="bg-transparent border-none outline-none w-full text-text-main font-black text-lg font-mono"
              />
            </div>
            {amount > refundable && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Maksimal {formatRupiah(refundable)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Metode Pengembalian:</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => {
                const isActive = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-2 text-center rounded-xl transition-all border ${
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
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Alasan Refund *</label>
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

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nomor Referensi (Opsional)</label>
            <input
              type="text"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              maxLength={100}
              placeholder="Mis. no. bukti transfer pengembalian"
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl text-sm bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
            />
          </div>
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
            disabled={submitting || !valid}
            className="flex-1 py-2.5 font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign className="w-4 h-4" />
            {submitting ? 'Memproses...' : 'Konfirmasi Refund'}
          </button>
        </div>
      </form>
    </div>
  );
};
