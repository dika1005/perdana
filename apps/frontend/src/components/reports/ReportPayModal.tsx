import React from 'react';
import { Check, CreditCard } from 'lucide-react';
import { ReceivableItem } from '../../types/report';
import { PaymentMethod } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';
import { Modal, Button, PaymentMethodSelector } from '../shared';

interface ReportPayModalProps {
  isOpen: boolean;
  item: ReceivableItem | null;
  payAmount: number;
  onChangeAmount: (val: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (pm: PaymentMethod) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ReportPayModal: React.FC<ReportPayModalProps> = ({
  isOpen,
  item,
  payAmount,
  onChangeAmount,
  paymentMethod,
  onPaymentMethodChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!item) return null;

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
            {submitting ? 'Memproses...' : 'Konfirmasi Lunas'}
          </Button>
        </>
      }
    >
      <div className="p-3.5 rounded-xl skeuo-inset bg-amber-50/40 dark:bg-amber-950/40 text-xs space-y-1.5 mb-4 border border-amber-200/50 dark:border-amber-800/50">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Total Belanja:</span>
          <span className="font-bold text-text-main">{formatRupiah(item.total_amount)}</span>
        </div>
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>Telah Masuk (DP):</span>
          <span className="font-bold">{formatRupiah(item.pay_amount)}</span>
        </div>
        <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>Sisa Tagihan:</span>
          <span className="font-mono">{formatRupiah(item.remaining_amount)}</span>
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

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nominal Pelunasan Diterima (Rp) *</label>
          <div className="px-4 py-2.5 skeuo-inset rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus-within:border-emerald-500 flex items-center gap-2">
            <span className="font-bold text-slate-400 text-sm">Rp</span>
            <input
              type="text"
              required
              value={payAmount > 0 ? payAmount.toLocaleString('id-ID') : ''}
              onChange={e => {
                const clean = e.target.value.replace(/\D/g, '');
                onChangeAmount(clean ? parseInt(clean, 10) : 0);
              }}
              placeholder="0"
              className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 font-bold text-base font-mono"
            />
          </div>
          {payAmount > 0 && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Terbilang: {formatRupiah(payAmount)}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
