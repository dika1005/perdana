'use client';

import React from 'react';
import { formatRupiah } from '../../utils/format';
import { Printer, Check, X, CreditCard, Receipt } from 'lucide-react';

interface ReceiptModalProps {
  invoiceData: any | null;
  onClose: () => void;
  onPrint?: () => void;
}

export function generateReceiptHtml(invoiceData: any): string {
  if (!invoiceData) return '';

  const items = invoiceData.items || [];
  const itemsHtml = items.map((item: any) => {
    const unitPrice = Number(item.price || item.custom_price || item.unit_price || 0);
    const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * Number(item.qty || 1));
    const dim = item.length && item.width ? `<div style="font-size: 10px; color: #333; margin-left: 4px;">Ukuran: ${item.length}m x ${item.width}m</div>` : '';
    
    let addonsText = '';
    if (item.addons && item.addons.length > 0) {
      addonsText = `<div style="font-size: 10px; color: #444; margin-left: 4px;">+ Finishing: ${item.addons.map((a: any) => `${a.addon_name || a.name || 'Finishing'}${a.qty > 1 ? ` (${a.qty}x)` : ''}`).join(', ')}</div>`;
    }

    return `
      <div class="receipt-item">
        <div class="item-name">${item.product_name || item.name || 'Produk'} ${item.variant_name ? `(${item.variant_name})` : ''}</div>
        ${dim}
        ${addonsText}
        <div class="item-math">
          <span>${item.qty || 1} x ${formatRupiah(unitPrice)}</span>
          <span class="item-sub">${formatRupiah(subtotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  const totalAmount = Number(invoiceData.total_amount || invoiceData.total || 0);
  const payAmount = Number(invoiceData.pay_amount || 0);
  const isDp = invoiceData.payment_status === 'DP' || Number(invoiceData.remaining_amount) > 0 || (totalAmount > payAmount);
  const remaining = Number(invoiceData.remaining_amount) || Math.max(0, totalAmount - payAmount);
  const changeAmount = Number(invoiceData.change_amount) || (payAmount > totalAmount ? payAmount - totalAmount : 0);

  const formattedDate = invoiceData.created_at 
    ? new Date(invoiceData.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk Nota - ${invoiceData.invoice_number || 'Perdana'}</title>
        <style>
          @page {
            size: auto;
            margin: 4mm 6mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: "Courier New", Courier, monospace, Arial, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 6px;
            font-size: 12px;
            line-height: 1.35;
          }
          .receipt-wrap {
            width: 100%;
            max-width: 320px;
            margin: 0 auto;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .divider-double {
            border-top: 2px solid #000;
            margin: 6px 0;
          }
          .header-title {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .header-sub {
            font-size: 10px;
            margin: 2px 0 0 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .receipt-item {
            margin-bottom: 6px;
          }
          .item-name {
            font-weight: bold;
          }
          .item-math {
            display: flex;
            justify-content: space-between;
            padding-left: 6px;
            margin-top: 1px;
          }
          .item-sub {
            font-weight: bold;
          }
          .total-row {
            font-size: 13px;
            font-weight: bold;
          }
          .footer-msg {
            font-size: 10px;
            text-align: center;
            margin-top: 8px;
            line-height: 1.4;
          }
          .status-badge {
            display: inline-block;
            padding: 1px 4px;
            border: 1px solid #000;
            font-size: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="receipt-wrap">
          <div class="text-center">
            <div class="header-title">${invoiceData.store_name || 'PERCETAKAN PERDANA'}</div>
            <div class="header-sub">${invoiceData.store_address || 'Depan Polsek Ciawigebang - Kuningan'}</div>
            <div class="header-sub">Telp: ${invoiceData.store_phone || '0812-3456-7890'}</div>
          </div>

          <div class="divider"></div>

          <div class="row">
            <span>No. Nota:</span>
            <span class="font-bold">${invoiceData.invoice_number || '-'}</span>
          </div>
          <div class="row">
            <span>Waktu:</span>
            <span>${formattedDate}</span>
          </div>
          <div class="row">
            <span>Pelanggan:</span>
            <span class="font-bold">${invoiceData.customer_name || 'Pelanggan Umum'}</span>
          </div>
          ${invoiceData.cashier_name ? `
            <div class="row">
              <span>Kasir:</span>
              <span>${invoiceData.cashier_name}</span>
            </div>
          ` : ''}
          <div class="row">
            <span>Metode Bayar:</span>
            <span>${invoiceData.payment_method || 'CASH'}</span>
          </div>
          <div class="row">
            <span>Status:</span>
            <span class="status-badge">${invoiceData.payment_status === 'PAID' ? 'LUNAS' : invoiceData.payment_status === 'DP' ? 'UANG MUKA (DP)' : 'BELUM BAYAR'}</span>
          </div>

          <div class="divider"></div>

          <div class="items-list">
            ${itemsHtml || '<div style="text-align: center; padding: 4px;">(Pesanan Cetak)</div>'}
          </div>

          <div class="divider"></div>

          <div class="row">
            <span>Subtotal:</span>
            <span>${formatRupiah(invoiceData.subtotal || invoiceData.subtotal_amount || totalAmount)}</span>
          </div>
          ${Number(invoiceData.discount_amount) > 0 ? `
            <div class="row">
              <span>Diskon:</span>
              <span>- ${formatRupiah(invoiceData.discount_amount)}</span>
            </div>
          ` : ''}

          <div class="divider-double"></div>

          <div class="row total-row">
            <span>TOTAL TAGIHAN:</span>
            <span>${formatRupiah(totalAmount)}</span>
          </div>

          <div class="row">
            <span>Uang Diterima:</span>
            <span>${formatRupiah(payAmount)}</span>
          </div>

          ${isDp ? `
            <div class="row font-bold" style="border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
              <span>SISA TAGIHAN:</span>
              <span>${formatRupiah(remaining)}</span>
            </div>
          ` : `
            <div class="row">
              <span>Kembalian:</span>
              <span>${formatRupiah(changeAmount)}</span>
            </div>
          `}

          <div class="divider"></div>

          <div class="footer-msg">
            <div class="font-bold">Terima kasih atas kepercayaan Anda!</div>
            <div>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</div>
            <div style="font-size: 9px; margin-top: 3px;">Simpan struk nota ini sebagai bukti sah pengambilan.</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoiceData,
  onClose,
}) => {
  if (!invoiceData) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = generateReceiptHtml(invoiceData);
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      setTimeout(function() {
        printWindow.close();
      }, 500);
    };
  };

  const totalAmount = Number(invoiceData.total_amount || invoiceData.total || 0);
  const payAmount = Number(invoiceData.pay_amount || 0);
  const isDp = invoiceData.payment_status === 'DP' || Number(invoiceData.remaining_amount) > 0 || (totalAmount > payAmount);
  const remaining = Number(invoiceData.remaining_amount) || Math.max(0, totalAmount - payAmount);
  const changeAmount = Number(invoiceData.change_amount) || (payAmount > totalAmount ? payAmount - totalAmount : 0);

  const formattedDate = invoiceData.created_at 
    ? new Date(invoiceData.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="p-5 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl my-auto">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Struk Nota Transaksi
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Clean Screen Preview */}
        <div className="bg-white text-black p-4 font-mono text-[11px] leading-tight rounded-lg border border-slate-300 shadow-inner mb-4 space-y-2">
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <p className="font-black text-xs uppercase">{invoiceData.store_name || 'PERCETAKAN PERDANA'}</p>
            <p className="text-[10px] text-slate-600">{invoiceData.store_address || 'Depan Polsek Ciawigebang - Kuningan'}</p>
            <p className="text-[10px] text-slate-600">Telp: {invoiceData.store_phone || '0812-3456-7890'}</p>
          </div>

          <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
            <div className="flex justify-between">
              <span>No. Nota:</span>
              <span className="font-bold">{invoiceData.invoice_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-bold">{invoiceData.customer_name || 'Pelanggan Umum'}</span>
            </div>
            {invoiceData.cashier_name && (
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{invoiceData.cashier_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Metode:</span>
              <span>{invoiceData.payment_method || 'CASH'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${
                invoiceData.payment_status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                  : 'bg-amber-50 text-amber-800 border-amber-400'
              }`}>
                {invoiceData.payment_status === 'PAID' ? 'LUNAS' : invoiceData.payment_status === 'DP' ? 'UANG MUKA (DP)' : 'BELUM BAYAR'}
              </span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="py-1 border-b border-dashed border-slate-400 space-y-1.5 max-h-48 overflow-y-auto">
            {(invoiceData.items || []).length === 0 ? (
              <p className="text-center py-2 text-slate-400 text-[10px]">(Pesanan Cetak)</p>
            ) : (
              (invoiceData.items || []).map((item: any, idx: number) => {
                const unitPrice = Number(item.price || item.custom_price || item.unit_price || 0);
                const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * Number(item.qty || 1));
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      {item.product_name || item.name || 'Produk'} {item.variant_name ? `(${item.variant_name})` : ''}
                    </div>
                    {item.length && item.width && (
                      <div className="text-[10px] text-slate-600 pl-1">
                        Ukuran: {item.length}m x {item.width}m
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className="text-[9px] text-slate-500 pl-1">
                        + Finishing: {item.addons.map((a: any) => `${a.addon_name || a.name || 'Finishing'}${a.qty > 1 ? ` (${a.qty}x)` : ''}`).join(', ')}
                      </div>
                    )}
                    <div className="flex justify-between pl-1 text-[10px] text-slate-700">
                      <span>{item.qty || 1} x {formatRupiah(unitPrice)}</span>
                      <span className="font-bold">{formatRupiah(subtotal)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 text-[10px]">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span>{formatRupiah(invoiceData.subtotal || invoiceData.subtotal_amount || totalAmount)}</span>
            </div>
            {Number(invoiceData.discount_amount) > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Diskon:</span>
                <span>- {formatRupiah(invoiceData.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-black border-t-2 border-slate-800 pt-1 text-slate-900">
              <span>TOTAL TAGIHAN:</span>
              <span>{formatRupiah(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Uang Diterima:</span>
              <span>{formatRupiah(payAmount)}</span>
            </div>
            {isDp ? (
              <div className="flex justify-between font-bold text-amber-900 border-t border-dashed border-slate-400 pt-1">
                <span>SISA TAGIHAN:</span>
                <span>{formatRupiah(remaining)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-700">
                <span>Kembalian:</span>
                <span>{formatRupiah(changeAmount)}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[9px] text-slate-600 space-y-0.5">
            <p className="font-semibold text-slate-800">Terima kasih atas pesanan Anda!</p>
            <p className="text-[8px] text-slate-500">Barang yang sudah dibeli tidak dapat ditukar.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-xs rounded-xl"
          >
            Tutup
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Struk Nota
          </button>
        </div>
      </div>
    </div>
  );
};
