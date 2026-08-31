'use client';

import React, { useState } from 'react';
import { AlertCircle, DollarSign } from 'lucide-react';
import { PaymentMethod } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';
import { Modal, Button, Field, Textarea, Input, PaymentMethodSelector } from '../shared';

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
    <Modal
      open
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Proses Refund Pelanggan"
      subtitle={<>{transaction?.invoice_number} • <strong className="text-text-main">{transaction?.customer_name || 'Pelanggan Umum'}</strong></>}
      icon={<DollarSign className="w-5 h-5" />}
      maxWidth="sm"
      zIndex={60}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Kembali
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || !valid} className="flex-1">
            <DollarSign className="w-4 h-4" />
            {submitting ? 'Memproses...' : 'Konfirmasi Refund'}
          </Button>
        </>
      }
    >
      <div className="p-3 rounded-xl text-xs mb-4 border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
        Refund maksimal sebesar uang yang tercatat di sistem ({formatRupiah(refundable)}).
        Tindakan ini tercatat di ledger beserta nama Anda dan alasannya.
      </div>

      <div className="space-y-3.5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nominal Refund (Rp) *</label>
            <button
              type="button"
              onClick={() => setAmount(refundable)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Refund Penuh
            </button>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl skeuo-inset bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 flex items-center gap-2">
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

        <Field label="Metode Pengembalian">
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
        </Field>

        <Field label="Alasan Refund" required>
          <Textarea
            required
            minLength={2}
            maxLength={255}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
          />
        </Field>

        <Field label="Nomor Referensi (Opsional)">
          <Input
            type="text"
            value={referenceNo}
            onChange={e => setReferenceNo(e.target.value)}
            maxLength={100}
            placeholder="Mis. no. bukti transfer pengembalian"
          />
        </Field>
      </div>
    </Modal>
  );
};
