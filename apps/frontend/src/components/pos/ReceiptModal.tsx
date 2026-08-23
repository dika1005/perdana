'use client';

import React from 'react';
import { Check, X, Printer } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

interface ReceiptModalProps {
  invoiceData: any | null;
  onClose: () => void;
  onPrint: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoiceData,
  onClose,
  onPrint,
}) => {
  if (!invoiceData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span>Transaksi Selesai!</span>
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Preview */}
        <div id="printable-receipt" className="bg-white text-black p-5 font-mono text-[11px] leading-tight rounded-xl shadow-inner mb-4 space-y-2.5 border border-slate-300">
          {/* Logo & Store Header */}
          <div className="text-center pb-2.5 border-b border-dashed border-slate-400">
            <div className="w-9 h-9 mx-auto mb-1.5 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <p className="font-black text-sm tracking-wider uppercase">{invoiceData.store_name || 'PERDANA PRINTING & POS'}</p>
            <p className="text-[9px] text-slate-500 font-sans mt-0.5">Digital Printing & Offset Solution</p>
            <p className="text-[10px] text-slate-600 mt-1">{invoiceData.store_address || 'Jl. Percetakan Perdana No. 1, Kota'}</p>
            <p className="text-[10px] text-slate-600 font-semibold">Telp: {invoiceData.store_phone || '0812-3456-7890'}</p>
          </div>

          <div className="text-[10px] space-y-1 border-b border-dashed border-slate-400 pb-2">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Nota:</span>
              <span className="font-bold tracking-tight">{invoiceData.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{invoiceData.created_at ? new Date(invoiceData.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan:</span>
              <span className="font-semibold">{invoiceData.customer_name || 'Pelanggan Umum'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Bayar:</span>
              <span className="font-bold uppercase">{invoiceData.payment_status}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-2 py-1 border-b border-dashed border-slate-400">
            {invoiceData.items && invoiceData.items.map((item: any, idx: number) => {
              const unitPrice = Number(item.price || item.custom_price || 0);
              const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * item.qty);

              return (
                <div key={idx} className="space-y-0.5">
                  <p className="font-bold text-[11px]">
                    {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}
                  </p>
                  {item.length && item.width && (
                    <p className="text-[9px] text-slate-500">
                      Ukuran: {item.length}m × {item.width}m ({((item.length || 1) * (item.width || 1)).toFixed(1)} m²)
                    </p>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-600 pl-2">
                    <span>{item.qty} × {formatRupiah(unitPrice)}</span>
                    <span className="font-bold text-black">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary / Total */}
          <div className="space-y-1 pt-1 text-[10px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatRupiah(invoiceData.subtotal || invoiceData.subtotal_amount || invoiceData.total_amount)}</span>
            </div>
            {Number(invoiceData.discount_amount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Diskon</span>
                <span>- {formatRupiah(invoiceData.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xs pt-1.5 border-t border-slate-400 text-black">
              <span>TOTAL</span>
              <span>{formatRupiah(invoiceData.total_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-800">
              <span>BAYAR</span>
              <span className="font-semibold">{formatRupiah(invoiceData.pay_amount)}</span>
            </div>
            {Number(invoiceData.remaining_amount) > 0 || (Number(invoiceData.total_amount) > Number(invoiceData.pay_amount)) ? (
              <div className="flex justify-between text-red-600 font-bold">
                <span>SISA PIUTANG</span>
                <span>
                  {formatRupiah(invoiceData.remaining_amount || (Number(invoiceData.total_amount) - Number(invoiceData.pay_amount)))}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-800">
                <span>KEMBALI</span>
                <span className="font-semibold">{formatRupiah(invoiceData.change_amount || 0)}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-2.5 border-t border-dashed border-slate-400 text-[9px] text-slate-600 font-sans space-y-1">
            <p className="font-semibold text-slate-800">Terima kasih atas pesanan Anda!</p>
            <p className="text-[8.5px] text-slate-500">Pantau progres pesanan secara langsung di:</p>
            <p className="text-[9px] font-mono font-bold text-blue-600">
              /cek-pesanan?invoice={invoiceData.invoice_number}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-xs rounded-xl hover:text-slate-900"
          >
            Selesai
          </button>
          <button 
            type="button"
            onClick={onPrint}
            className="flex-1 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs flex items-center justify-center gap-2 rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
