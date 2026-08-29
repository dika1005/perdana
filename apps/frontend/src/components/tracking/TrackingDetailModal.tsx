'use client';

import React from 'react';
import { FileText, Printer, CreditCard, X, CheckCircle, Clock } from 'lucide-react';
import { Customer } from '../../types/customer';
import { formatRupiah } from '../../utils/format';

interface TrackingDetailModalProps {
  isOpen: boolean;
  job: any | null;
  customers: Customer[];
  onClose: () => void;
  onPrintSpk: (job: any) => void;
  onPrintReceipt: (invoiceData: any) => void;
  onOpenSettle?: (job: any) => void;
}

export const TrackingDetailModal: React.FC<TrackingDetailModalProps> = ({
  isOpen,
  job,
  customers,
  onClose,
  onPrintSpk,
  onPrintReceipt,
  onOpenSettle,
}) => {
  if (!isOpen || !job) return null;

  const cust = customers.find(c => c.id === job.customer_id);
  const isDP = job.payment_status === 'DP' || job.payment_status === 'UNPAID';
  const remaining = Number(job.total_amount) - Number(job.pay_amount);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Detail Pesanan & Cek Nota
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {job.invoice_number} • {new Date(job.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
          {/* Customer & Status Bar */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Pemesan:</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{job.customer_name || 'Pelanggan Umum'}</p>
              {cust?.phone && <p className="text-slate-500 font-mono">{cust.phone}</p>}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Status Pengerjaan:</span>
              <span className="inline-block px-2.5 py-0.5 rounded-md font-extrabold text-[11px] mt-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {job.order_status}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Deadline: <strong>{job.estimated_done_at || 'Secepatnya'}</strong>
              </p>
            </div>
          </div>

          {/* Rincian Produk List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Rincian Item yang Dipesan:
            </span>

            {(job.items || []).map((item: any, idx: number) => {
              const unitPrice = Number(item.price || item.custom_price || 0);
              const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * item.qty);

              return (
                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {item.product_name}
                      </h4>
                      {item.variant_name && (
                        <span className="text-[11px] text-slate-500">Varian: {item.variant_name}</span>
                      )}
                      {item.length && item.width && (
                        <p className="text-[11px] text-blue-600 font-medium">
                          Ukuran: {item.length} m × {item.width} m (Luas: {(item.length * item.width * item.qty).toFixed(1)} m²)
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatRupiah(subtotal)}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.qty} × {formatRupiah(unitPrice)}
                      </p>
                    </div>
                  </div>

                  {item.addons && item.addons.length > 0 && (
                    <div className="pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                      Finishing: {item.addons.map((a: any) => a.addon_name).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rincian Finansial & Pembayaran */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Total Pesanan:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatRupiah(job.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Telah Dibayar (DP):</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(job.pay_amount)}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center">
              <span className="font-bold text-slate-900 dark:text-slate-100">Status Pembayaran:</span>
              {isDP ? (
                <span className="font-bold font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  Sisa Tagihan: {formatRupiah(remaining)}
                </span>
              ) : (
                <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  LUNAS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold skeuo-button text-slate-600 dark:text-slate-400 text-xs rounded-xl"
          >
            Tutup
          </button>

          <div className="flex flex-wrap gap-2">
            {/* Tombol Cetak SPK (Hanya muncul jika belum selesai diambil) */}
            {job.order_status !== 'DIAMBIL' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintSpk(job);
                }}
                className="px-3.5 py-2 font-bold skeuo-button text-blue-600 dark:text-blue-400 text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak SPK Kerja</span>
              </button>
            )}

            {/* Tombol Cetak Struk Nota Kasir */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onPrintReceipt(job);
              }}
              className="px-3.5 py-2 font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak Struk Nota</span>
            </button>

            {/* Tombol Lunasi jika DP */}
            {isDP && onOpenSettle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettle(job);
                }}
                className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Proses Pelunasan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
