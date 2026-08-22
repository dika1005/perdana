'use client';

import React from 'react';
import { X, User, Clock } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

interface TransactionDetailDrawerProps {
  transaction: any | null;
  onClose: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-md bg-bg-skeuo h-full p-6 skeuo overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start pb-4 border-b border-black/10">
            <div>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                DETAIL TRANSAKSI
              </span>
              <h2 className="text-xl font-mono font-black text-text-main mt-1">
                {transaction.invoice_number}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-main">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-3 text-xs">
            <div className="flex items-center justify-between text-text-muted">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Waktu Pesanan:</span>
              <span className="font-semibold text-text-main">
                {new Date(transaction.created_at).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Pelanggan:</span>
              <span className="font-bold text-text-main">{transaction.customer_name || 'Pelanggan Umum'}</span>
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span>Status Bayar:</span>
              <span className="font-bold">{transaction.payment_status}</span>
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span>Status Produksi:</span>
              <span className="font-bold">{transaction.order_status}</span>
            </div>

            {transaction.estimated_done_at && (
              <div className="flex items-center justify-between text-text-muted">
                <span>Estimasi Selesai:</span>
                <span className="font-semibold">{transaction.estimated_done_at}</span>
              </div>
            )}
          </div>

          {/* Rincian Item */}
          <div className="mt-2 border-t border-black/10 pt-4">
            <h3 className="font-bold text-xs text-text-main mb-3">Daftar Item Pesanan:</h3>
            <div className="space-y-2">
              {transaction.items && transaction.items.map((item: any) => (
                <div key={item.id} className="p-3 skeuo-inset rounded-xl bg-white/40 dark:bg-black/20 text-xs">
                  <div className="flex justify-between font-bold text-text-main">
                    <span>{item.product_name || `Produk #${item.product_id}`}</span>
                    <span>{formatRupiah(Number(item.custom_price || 0) * item.qty)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted mt-1">
                    <span>{item.qty} pcs @ {formatRupiah(item.custom_price || 0)}</span>
                    {item.length && item.width && (
                      <span className="text-purple-600 dark:text-purple-400 font-mono">
                        {item.length}m × {item.width}m ({item.length * item.width} m²)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mt-4 p-4 rounded-xl skeuo-inset bg-brand-50/40 text-xs space-y-2">
            <div className="flex justify-between text-text-muted">
              <span>Total Belanja:</span>
              <span className="font-bold text-text-main">
                {formatRupiah(transaction.total_amount)}
              </span>
            </div>
            {Number(transaction.discount_amount) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon:</span>
                <span>- {formatRupiah(transaction.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Dibayar:</span>
              <span>{formatRupiah(transaction.pay_amount)}</span>
            </div>
            {Number(transaction.total_amount) - Number(transaction.pay_amount) > 0 && (
              <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-black/5">
                <span>Sisa Piutang:</span>
                <span>
                  {formatRupiah(Number(transaction.total_amount) - Number(transaction.pay_amount))}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-black/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
