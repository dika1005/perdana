'use client';

import React from 'react';
import { Calendar, Check, Clock, CreditCard, FileText, Wallet } from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';
import { Modal, Button, Field, PaymentMethodSelector } from '../shared';

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

const PAYMENT_STATUS_OPTIONS = [
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
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Konfirmasi Pembayaran"
      subtitle={<>Pelanggan: <strong className="text-text-main">{customerName}</strong></>}
      icon={<CreditCard className="w-4 h-4" />}
      onSubmit={onSubmit}
      footer={
        <>
          <Button className="flex-1" onClick={onClose} disabled={submitting}>Batal</Button>
          <Button variant="primary" className="flex-1" type="submit" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Proses & Cetak Nota'}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="p-3 rounded-xl bg-brand-50/80 dark:bg-brand-950/50 border border-brand-200/80 dark:border-brand-900/60 flex justify-between items-center">
          <span className="text-xs font-bold text-text-muted">Total Tagihan:</span>
          <span className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono">
            {formatRupiah(total)}
          </span>
        </div>

        <Field label="Metode Bayar">
          <PaymentMethodSelector value={paymentMethod} onChange={onPaymentMethodChange} />
        </Field>

        <Field label="Status Pembayaran">
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_STATUS_OPTIONS.map(st => {
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
                  className={`py-2 px-2 text-center rounded-xl transition-all border cursor-pointer ${
                    isActive
                      ? `${st.activeColor} font-bold shadow-xs`
                      : 'border-slate-200 dark:border-slate-800 skeuo-button text-slate-600 dark:text-slate-400 hover:text-text-main'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mx-auto mb-1" />
                  <p className="text-xs font-bold">{st.label}</p>
                </button>
              );
            })}
          </div>
        </Field>

        {paymentStatus !== 'UNPAID' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-text-muted">
                {paymentStatus === 'DP' ? 'Nominal Uang Muka / DP (Rp):' : 'Nominal Dibayar (Rp):'}
              </label>
              <button
                type="button"
                onClick={() => onPayAmountChange(total)}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Bayar Uang Pas
              </button>
            </div>

            <div className="px-3.5 py-2 rounded-xl skeuo-inset focus-within:border-brand-500 flex items-center gap-2">
              <span className="font-bold text-text-muted text-sm">Rp</span>
              <input
                type="text"
                value={payAmount > 0 ? payAmount.toLocaleString('id-ID') : ''}
                onChange={e => {
                  const clean = e.target.value.replace(/\D/g, '');
                  onPayAmountChange(Math.min(clean ? parseInt(clean, 10) : 0, total));
                }}
                placeholder="0"
                className="bg-transparent border-none outline-none w-full text-text-main font-black text-xl font-mono"
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Maksimal sebesar total tagihan; kembalian dihitung manual di luar sistem.
            </p>

            {payAmount < total && paymentStatus === 'DP' && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Sisa Tagihan (Pelunasan Nanti):
                </span>
                <span className="font-mono text-sm font-black">{formatRupiah(total - payAmount)}</span>
              </div>
            )}
          </div>
        )}

        <Field
          label="Target Selesai / Siap Ambil (Opsional)"
        >
          <input
            type="date"
            value={estimatedDoneAt}
            onChange={e => onEstimatedDoneAtChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-sm text-text-main outline-none bg-transparent transition-colors focus:border-brand-500"
          />
        </Field>
      </div>
    </Modal>
  );
};
