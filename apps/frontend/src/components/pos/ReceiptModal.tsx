'use client';

import React from 'react';
import { formatRupiah } from '../../utils/format';
import { Printer, Receipt } from 'lucide-react';
import { STORE_IDENTITY, RECEIPT_FOOTER } from '../../data/storeIdentity';
import { Modal, Button } from '../shared';

interface ReceiptModalProps {
  invoiceData: any | null;
  onClose: () => void;
}

export function generateReceiptHtml(invoiceData: any): string {
  if (!invoiceData) return '';

  const items = invoiceData.items || [];
  const itemsHtml = items.map((item: any) => {
    const unitPrice = Number(item.price || item.custom_price || item.unit_price || 0);
    const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * Number(item.qty || 1));
    const isMeterItem = ((item.unit_name || '') + ' ' + (item.product_name || item.name || '')).toLowerCase().includes('meter');
    const dim = (isMeterItem && item.length && item.width) ? `<div style="font-size: 10px; color: #333; margin-left: 4px;">Ukuran: ${item.length}m x ${item.width}m</div>` : '';
    
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
  const payAmount = Number(invoiceData.paid_amount ?? invoiceData.pay_amount ?? 0);
  const isDp = invoiceData.payment_status === 'DP' || Number(invoiceData.remaining_amount) > 0 || (totalAmount > payAmount);
  const remaining = Number(invoiceData.remaining_amount) || Math.max(0, totalAmount - payAmount);

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
            <div class="header-title">${invoiceData.store_name || STORE_IDENTITY.name}</div>
            <div class="header-sub">${invoiceData.store_address || STORE_IDENTITY.address}</div>
            <div class="header-sub">Telp: ${invoiceData.store_phone || STORE_IDENTITY.phone}</div>
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
          ` : ''}

          <div class="divider"></div>

          <div class="footer-msg">
            <div class="font-bold">${RECEIPT_FOOTER.thanks}</div>
            <div>${RECEIPT_FOOTER.policy}</div>
            <div style="font-size: 9px; margin-top: 3px;">${RECEIPT_FOOTER.keepNote}</div>
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
  const payAmount = Number(invoiceData.paid_amount ?? invoiceData.pay_amount ?? 0);
  const isDp = invoiceData.payment_status === 'DP' || Number(invoiceData.remaining_amount) > 0 || (totalAmount > payAmount);
  const remaining = Number(invoiceData.remaining_amount) || Math.max(0, totalAmount - payAmount);

  const formattedDate = invoiceData.created_at 
    ? new Date(invoiceData.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Modal
      open
      onClose={onClose}
      title="Struk Nota Transaksi"
      icon={<Receipt className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="primary" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Cetak Struk Nota
          </Button>
        </>
      }
    >
      {/* Thermal Slip Clean Screen Preview */}
      <div className="bg-white text-black p-4 font-mono text-[11px] leading-tight rounded-lg border border-slate-300 shadow-inner space-y-2">
        <div className="text-center pb-2 border-b border-dashed border-slate-400">
          <p className="font-black text-xs uppercase">{invoiceData.store_name || STORE_IDENTITY.name}</p>
          <p className="text-[10px] text-slate-600">{invoiceData.store_address || STORE_IDENTITY.address}</p>
          <p className="text-[10px] text-slate-600">Telp: {invoiceData.store_phone || STORE_IDENTITY.phone}</p>
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
                  {(() => {
                    const isMeterItem = ((item.unit_name || '') + ' ' + (item.product_name || item.name || '')).toLowerCase().includes('meter');
                    return isMeterItem && item.length && item.width ? (
                      <div className="text-[10px] text-slate-600 pl-1">
                        Ukuran: {item.length}m x {item.width}m
                      </div>
                    ) : null;
                  })()}
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
          {isDp && (
            <div className="flex justify-between font-bold text-amber-900 border-t border-dashed border-slate-400 pt-1">
              <span>SISA TAGIHAN:</span>
              <span>{formatRupiah(remaining)}</span>
            </div>
          )}
        </div>

        <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[9px] text-slate-600 space-y-0.5">
          <p className="font-semibold text-slate-800">{RECEIPT_FOOTER.thanks}</p>
          <p>{RECEIPT_FOOTER.policy}</p>
          <p className="text-[8px] text-slate-500">{RECEIPT_FOOTER.keepNote}</p>
        </div>
      </div>
    </Modal>
  );
};
