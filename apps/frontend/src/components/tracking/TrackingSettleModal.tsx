import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { PaymentMethod } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';
import { Modal, Button, PaymentMethodSelector } from '../shared';

interface TrackingSettleModalProps {
  isOpen: boolean;
  job: any | null;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (pm: PaymentMethod) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TrackingSettleModal: React.FC<TrackingSettleModalProps> = ({
  isOpen,
  job,
  paymentMethod,
  onPaymentMethodChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!job) return null;

  const totalAmount = Number(job.total_amount) || 0;
  const currentPaid = Number(job.paid_amount ?? job.pay_amount) || 0;
  const remaining = totalAmount - currentPaid;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Pelunasan & Serahkan Pesanan"
      subtitle={<>{job.invoice_number} • <strong className="text-text-main">{job.customer_name}</strong></>}
      icon={<CheckCircle2 className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            <Check className="w-4 h-4" />
            {submitting ? 'Menyimpan...' : 'Lunasi & Serahkan'}
          </Button>
        </>
      }
    >
      <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/40 dark:bg-brand-950/40 text-xs space-y-1.5 mb-4 border border-brand-200/50 dark:border-brand-800/50">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Total Belanja:</span>
          <span className="font-bold text-text-main">{formatRupiah(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>Telah Dibayar (DP):</span>
          <span className="font-bold">{formatRupiah(currentPaid)} <span className="text-[10px] font-mono opacity-80">({job.payment_method || 'CASH'})</span></span>
        </div>
        <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>Sisa Tagihan (dilunasi):</span>
          <span className="font-mono">{formatRupiah(remaining)}</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
          Metode Pembayaran Pelunasan:
        </label>
        <PaymentMethodSelector value={paymentMethod} onChange={onPaymentMethodChange} />
        <p className="text-[10px] text-slate-400 mt-2">
          Sistem mencatat pelunasan tepat sebesar sisa tagihan; uang tunai & kembalian dihitung manual di luar sistem.
        </p>
      </div>
    </Modal>
  );
};
