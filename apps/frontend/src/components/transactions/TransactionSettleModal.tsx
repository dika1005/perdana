import React from 'react';
import { Check, CreditCard } from 'lucide-react';
import { PaymentMethod } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';
import { Modal, Button, PaymentMethodSelector } from '../shared';

interface TransactionSettleModalProps {
  isOpen: boolean;
  item: any | null;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (pm: PaymentMethod) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TransactionSettleModal: React.FC<TransactionSettleModalProps> = ({
  isOpen,
  item,
  paymentMethod,
  onPaymentMethodChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!item) return null;

  const total = Number(item.total_amount) || 0;
  const alreadyPaid = Number(item.paid_amount ?? item.pay_amount) || 0;
  const remaining = total - alreadyPaid;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Pelunasan Tagihan DP"
      subtitle={<>{item.invoice_number} • <strong className="text-text-main">{item.customer_name}</strong></>}
      icon={<CreditCard className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            <Check className="w-4 h-4" />
            {submitting ? 'Menyimpan...' : 'Simpan Pelunasan'}
          </Button>
        </>
      }
    >
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
          <PaymentMethodSelector value={paymentMethod} onChange={onPaymentMethodChange} />
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Sistem mencatat pelunasan tepat sebesar sisa tagihan. Uang tunai yang diterima dan kembalian dihitung manual di luar sistem.
        </p>
      </div>
    </Modal>
  );
};
