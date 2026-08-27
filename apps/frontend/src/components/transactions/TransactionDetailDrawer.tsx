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
              <span className="font-bold uppercase text-text-main">{transaction.payment_status}</span>
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span>Metode Pembayaran:</span>
              <span className="font-bold text-text-main">
                {transaction.payment_method === 'QRIS' ? '📱 QRIS' : transaction.payment_method === 'TRANSFER' ? '🏦 Transfer Bank' : '💵 Tunai (Cash)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span>Status Produksi:</span>
              <span className="font-bold text-text-main">{transaction.order_status}</span>
            </div>

            {transaction.estimated_done_at && (
              <div className="flex items-center justify-between text-text-muted">
                <span>Estimasi Selesai:</span>
                <span className="font-semibold text-text-main">{transaction.estimated_done_at}</span>
              </div>
            )}
          </div>

          {/* Rincian Item */}
          <div className="mt-2 border-t border-black/10 dark:border-white/10 pt-4">
            <h3 className="font-bold text-xs text-text-main mb-3">Daftar Item Pesanan:</h3>
            <div className="space-y-2">
              {transaction.items && transaction.items.map((item: any) => {
                const unitPrice = Number(item.price || item.custom_price || 0);
                const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * item.qty);

                return (
                  <div key={item.id} className="p-3 skeuo-inset rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-text-main">
                      <span>{item.product_name || `Produk #${item.product_id}`} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                      <span className="font-mono">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span>{item.qty} {item.unit_name || 'pcs'} @ {formatRupiah(unitPrice)}</span>
                      {item.length && item.width && (
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-semibold">
                          {item.length}m × {item.width}m ({((item.length || 1) * (item.width || 1)).toFixed(1)} m²)
                        </span>
                      )}
                    </div>
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400">
                        Finishing: {item.addons.map((a: any) => a.addon_name || a).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mt-4 p-4 rounded-xl skeuo-inset bg-brand-50/40 dark:bg-brand-950/40 text-xs space-y-2 border border-brand-200/50 dark:border-brand-800/50">
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
            
            {/* Payment Method Details */}
            {transaction.settlement_pay_amount ? (
              <>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>DP ({transaction.payment_method || 'CASH'}):</span>
                  <span className="font-semibold text-text-main">{formatRupiah(Number(transaction.pay_amount) - Number(transaction.settlement_pay_amount))}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Pelunasan ({transaction.settlement_payment_method || 'CASH'}):</span>
                  <span>{formatRupiah(transaction.settlement_pay_amount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Dibayar ({transaction.payment_method || 'CASH'}):</span>
                <span>{formatRupiah(transaction.pay_amount)}</span>
              </div>
            )}

            {Number(transaction.total_amount) - Number(transaction.pay_amount) > 0 && (
              <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
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
