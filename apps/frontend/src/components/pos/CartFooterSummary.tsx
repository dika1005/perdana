'use client';

import React from 'react';
import { CreditCard, Tag } from 'lucide-react';
import { formatRupiah } from '../../utils/format';
import { Button } from '../shared';

interface CartFooterSummaryProps {
  cartLength: number;
  subtotal: number;
  total: number;
  discountAmount: number;
  onDiscountChange: (val: number) => void;
  onOpenCheckout: () => void;
}

export const CartFooterSummary: React.FC<CartFooterSummaryProps> = ({
  cartLength,
  subtotal,
  total,
  discountAmount,
  onDiscountChange,
  onOpenCheckout,
}) => {
  return (
    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
      {/* Subtotal & Discount Row */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Subtotal ({cartLength} jenis):</span>
          <span className="font-semibold text-text-main font-mono">{formatRupiah(subtotal)}</span>
        </div>

        {/* Discount Input */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-xs">
            <Tag className="w-3 h-3 text-rose-500" />
            <span>Potongan Diskon:</span>
          </label>
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 w-32">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Rp</span>
            <input 
              type="text" 
              value={discountAmount > 0 ? discountAmount.toLocaleString('id-ID') : ''}
              onChange={e => {
                const clean = e.target.value.replace(/\D/g, '');
                onDiscountChange(clean ? parseInt(clean, 10) : 0);
              }}
              placeholder="0"
              className="w-full text-xs font-mono font-bold bg-transparent outline-none text-right text-rose-600 dark:text-rose-400"
            />
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 flex justify-between items-center">
        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Total Bayar:</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
            {formatRupiah(total)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        variant="primary"
        disabled={cartLength === 0}
        onClick={onOpenCheckout}
        className="w-full"
      >
        <CreditCard className="w-4 h-4" />
        Lanjut ke Pembayaran — {formatRupiah(total)}
      </Button>
    </div>
  );
};
