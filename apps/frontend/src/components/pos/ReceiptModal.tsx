'use client';

import React from 'react';
import { Check, X, Printer } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 w-full max-w-sm bg-bg-skeuo">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/10">
          <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" /> Transaksi Selesai!
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Preview */}
        <div id="thermal-receipt" className="bg-white text-black p-4 font-mono text-[11px] leading-tight rounded-lg shadow-inner mb-4 space-y-2 border border-slate-300">
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <p className="font-bold text-sm">{invoiceData.store_name || 'PERDANA PERCETAKAN'}</p>
            <p className="text-[10px] text-slate-600">{invoiceData.store_address || 'Jl. Percetakan Perdana No. 1'}</p>
            <p className="text-[10px] text-slate-600">Telp: {invoiceData.store_phone || '0812-3456-7890'}</p>
          </div>

          <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
            <div className="flex justify-between">
              <span>No. Nota:</span>
              <span className="font-bold">{invoiceData.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{new Date(invoiceData.created_at || Date.now()).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span>{invoiceData.customer_name || 'Pelanggan Umum'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status Bayar:</span>
              <span className="font-bold">{invoiceData.payment_status}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-1.5 py-1 border-b border-dashed border-slate-400">
            {invoiceData.items && invoiceData.items.map((item: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <p className="font-bold">{item.product_name}</p>
                <div className="flex justify-between text-[10px] text-slate-600 pl-2">
                  <span>{item.qty} × Rp {Number(item.custom_price || item.price || 0).toLocaleString('id-ID')}</span>
                  <span className="font-bold text-black">
                    Rp {(Number(item.custom_price || item.price || 0) * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary / Total */}
          <div className="space-y-1 pt-1 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {Number(invoiceData.subtotal || invoiceData.total_amount).toLocaleString('id-ID')}</span>
            </div>
            {Number(invoiceData.discount_amount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Diskon</span>
                <span>- Rp {Number(invoiceData.discount_amount).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
              <span>TOTAL</span>
              <span>Rp {Number(invoiceData.total_amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>BAYAR</span>
              <span>Rp {Number(invoiceData.pay_amount).toLocaleString('id-ID')}</span>
            </div>
            {Number(invoiceData.remaining_amount) > 0 ? (
              <div className="flex justify-between text-red-600 font-bold">
                <span>SISA PIUTANG</span>
                <span>Rp {Number(invoiceData.remaining_amount).toLocaleString('id-ID')}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span>KEMBALI</span>
                <span>Rp {Number(invoiceData.change_amount || 0).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-2.5 border-t border-dashed border-slate-400 text-[9px] text-slate-500">
            <p>Terima kasih atas pesanan Anda!</p>
            <p>Simpan nota ini untuk pengambilan barang.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
          >
            Selesai
          </button>
          <button 
            onClick={onPrint}
            className="flex-1 py-2.5 font-bold skeuo-button bg-brand-500 text-white shadow-none border-none hover:bg-brand-600 text-xs flex items-center justify-center gap-1.5 rounded-xl"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
};
