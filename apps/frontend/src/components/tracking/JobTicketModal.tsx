'use client';

import React from 'react';
import { Customer } from '../../types/customer';

interface JobTicketModalProps {
  isOpen: boolean;
  job: any | null;
  customers: Customer[];
  onClose: () => void;
}

export const JobTicketModal: React.FC<JobTicketModalProps> = ({
  isOpen,
  job,
  customers,
  onClose,
}) => {
  if (!isOpen || !job) return null;

  const cust = customers.find(c => c.id === job.customer_id);

  const generatePrintHtml = () => {
    const items = (job.items && job.items.length > 0 ? job.items : [{
      product_name: job.product_name || 'Pesanan Cetak Kustom',
      qty: job.qty || 1,
      variant_name: job.variant_name,
      length: job.length,
      width: job.width,
      addons: job.addons || []
    }]);

    const itemsHtml = items.map((item: any, idx: number) => {
      const addonsHtml = item.addons && item.addons.length > 0
        ? `<div class="addons-wrap">
            <span class="addons-label">Finishing / Instruksi Tambahan:</span>
            <ul class="addons-list">
              ${item.addons.map((a: any) => `<li>${a.addon_name} ${a.qty > 1 ? `(${a.qty}x)` : ''}</li>`).join('')}
            </ul>
           </div>`
        : '';

      const dimensionHtml = item.length && item.width
        ? `<div class="dim-text">Ukuran / Dimensi: <strong>${item.length} m x ${item.width} m</strong> (Total: ${(item.length * item.width * item.qty).toFixed(1)} m2)</div>`
        : '';

      return `
        <div class="product-box">
          <table class="product-table">
            <tr>
              <td class="product-main">
                <span class="item-tag">ITEM #${idx + 1}</span>
                <div class="product-name">${item.product_name}</div>
                ${item.variant_name ? `<div class="product-variant">Varian: <strong>${item.variant_name}</strong></div>` : ''}
                ${dimensionHtml}
                ${addonsHtml}
              </td>
              <td class="product-qty-col">
                <div class="qty-box">
                  <div class="qty-title">JUMLAH</div>
                  <div class="qty-num">${item.qty}</div>
                  <div class="qty-unit">${item.unit_name || 'Pcs/Buku'}</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>SPK Produksi - ${job.invoice_number}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              font-size: 13px;
              line-height: 1.4;
            }
            .spk-wrapper {
              border: 2px solid #000;
              padding: 16px 20px;
              width: 100%;
              margin: 0 auto;
            }
            
            /* Header */
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .shop-title {
              font-size: 20px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0 0 2px 0;
            }
            .shop-address {
              font-size: 11px;
              color: #333;
              margin: 0;
            }
            .spk-title {
              display: inline-block;
              background: #000;
              color: #fff;
              font-size: 13px;
              font-weight: bold;
              padding: 4px 14px;
              margin-top: 8px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            /* Meta Info Table */
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
              border: 1px solid #000;
            }
            .meta-table td {
              padding: 6px 10px;
              font-size: 12px;
              border: 1px solid #000;
            }
            .meta-label {
              width: 100px;
              font-weight: bold;
              background: #f4f4f4;
            }
            .meta-val {
              font-weight: bold;
            }
            .deadline-val {
              font-size: 13px;
              font-weight: bold;
              text-decoration: underline;
            }

            /* Product Boxes */
            .section-header {
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 12px 0 6px 0;
              padding-bottom: 3px;
              border-bottom: 1px solid #000;
            }
            .product-box {
              border: 1.5px solid #000;
              margin-bottom: 10px;
              padding: 10px 12px;
            }
            .product-table {
              width: 100%;
              border-collapse: collapse;
            }
            .product-main {
              vertical-align: top;
            }
            .item-tag {
              font-size: 10px;
              font-weight: bold;
              background: #eee;
              padding: 1px 5px;
              border: 1px solid #ccc;
              display: inline-block;
              margin-bottom: 4px;
            }
            .product-name {
              font-size: 15px;
              font-weight: bold;
              color: #000;
              margin-bottom: 2px;
            }
            .product-variant {
              font-size: 12px;
              color: #222;
              margin-top: 2px;
            }
            .dim-text {
              font-size: 12px;
              margin-top: 4px;
            }
            .product-qty-col {
              width: 140px;
              vertical-align: middle;
              text-align: right;
            }
            .qty-box {
              border: 1.5px solid #000;
              background: #f8f8f8;
              padding: 6px;
              text-align: center;
            }
            .qty-title {
              font-size: 9px;
              font-weight: bold;
              color: #333;
            }
            .qty-num {
              font-size: 20px;
              font-weight: bold;
              font-family: monospace;
              line-height: 1.1;
              margin: 2px 0;
            }
            .qty-unit {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            /* Addons */
            .addons-wrap {
              margin-top: 8px;
              padding-top: 6px;
              border-top: 1px dashed #666;
            }
            .addons-label {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              display: block;
              margin-bottom: 2px;
            }
            .addons-list {
              margin: 0;
              padding-left: 16px;
              font-size: 12px;
            }

            /* Checklist Table */
            .checklist-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
              border: 1.5px solid #000;
            }
            .checklist-table th {
              background: #f4f4f4;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              padding: 5px 8px;
              border: 1px solid #000;
              text-align: left;
            }
            .checklist-table td {
              border: 1px solid #000;
              padding: 6px 8px;
              font-size: 12px;
            }
            .box-check {
              display: inline-block;
              width: 13px;
              height: 13px;
              border: 1px solid #000;
              margin-right: 6px;
              vertical-align: middle;
            }

            /* Signature */
            .sign-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .sign-table td {
              width: 33.33%;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              padding: 0 10px;
            }
            .sign-line {
              border-top: 1px solid #000;
              margin-top: 45px;
            }
          </style>
        </head>
        <body>
          <div class="spk-wrapper">
            <!-- Header -->
            <div class="header">
              <h1 class="shop-title">PERDANA PERCETAKAN DIGITAL</h1>
              <p class="shop-address">Jl. Siliwangi No. 45 - Telp / WhatsApp: 0812-3456-7890</p>
              <div class="spk-title">SURAT PERINTAH KERJA (SPK) OPERATOR</div>
            </div>

            <!-- Meta Table -->
            <table class="meta-table">
              <tr>
                <td class="meta-label">No. Nota</td>
                <td class="meta-val" style="font-family: monospace;">${job.invoice_number}</td>
                <td class="meta-label">Tgl Masuk</td>
                <td class="meta-val">${new Date(job.created_at).toLocaleDateString('id-ID')}</td>
              </tr>
              <tr>
                <td class="meta-label">Pemesan</td>
                <td class="meta-val">${job.customer_name || 'Pelanggan Umum'}</td>
                <td class="meta-label">Deadline</td>
                <td class="meta-val deadline-val">
                  ${job.estimated_done_at ? job.estimated_done_at : 'SECEPATNYA'}
                </td>
              </tr>
              <tr>
                <td class="meta-label">No. Telepon</td>
                <td class="meta-val" style="font-family: monospace;">${cust?.phone || '-'}</td>
                <td class="meta-label">Petugas Kasir</td>
                <td class="meta-val">${job.cashier_name || 'Admin'}</td>
              </tr>
            </table>

            <!-- Section Title -->
            <div class="section-header">
              RINCIAN ITEM PRODUK (${items.length} ITEM):
            </div>

            <!-- Products List -->
            ${itemsHtml}

            <!-- Checklist Table -->
            <table class="checklist-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Tahapan Pengerjaan</th>
                  <th style="width: 25%;">Status</th>
                  <th style="width: 25%;">Jam Selesai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="box-check"></span> 1. Setting Desain & Layout File</td>
                  <td>[   ] Selesai Setting</td>
                  <td>___ : ___</td>
                </tr>
                <tr>
                  <td><span class="box-check"></span> 2. Cetak Mesin / Kertas</td>
                  <td>[   ] Selesai Cetak</td>
                  <td>___ : ___</td>
                </tr>
                <tr>
                  <td><span class="box-check"></span> 3. Finishing, Potong & Jilid</td>
                  <td>[   ] Selesai Finishing</td>
                  <td>___ : ___</td>
                </tr>
                <tr>
                  <td><span class="box-check"></span> 4. QC, Packing & Siap Diambil</td>
                  <td>[   ] Siap di Rak Kasir</td>
                  <td>___ : ___</td>
                </tr>
              </tbody>
            </table>

            <!-- Signatures -->
            <table class="sign-table">
              <tr>
                <td>
                  Operator Desain
                  <div class="sign-line"></div>
                </td>
                <td>
                  Operator Cetak
                  <div class="sign-line"></div>
                </td>
                <td>
                  QC & Packing
                  <div class="sign-line"></div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = generatePrintHtml();
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

  const items = (job.items && job.items.length > 0 ? job.items : [{
    product_name: job.product_name || 'Pesanan Cetak Kustom',
    qty: job.qty || 1,
    variant_name: job.variant_name,
    length: job.length,
    width: job.width,
    addons: job.addons || []
  }]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Tiket Kerja Operator / SPK Produksi
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            ✕
          </button>
        </div>

        {/* Modal Preview Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-100 dark:bg-slate-950/60">
          <div className="p-5 bg-white text-black rounded-lg border border-black shadow-sm mx-auto max-w-lg font-sans text-xs">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2.5 mb-3">
              <h2 className="text-base font-bold uppercase tracking-tight">PERDANA PERCETAKAN DIGITAL</h2>
              <p className="text-[10px] text-gray-700">Jl. Siliwangi No. 45 - Telp/WA: 0812-3456-7890</p>
              <div className="inline-block bg-black text-white font-bold text-[11px] px-3 py-0.5 mt-1.5 uppercase">
                SURAT PERINTAH KERJA (SPK) OPERATOR
              </div>
            </div>

            {/* Meta */}
            <table className="w-full border-collapse border border-black mb-3 text-[11px]">
              <tbody>
                <tr className="border-b border-black">
                  <td className="p-1.5 bg-gray-100 font-bold w-24 border-r border-black">No. Nota</td>
                  <td className="p-1.5 font-mono font-bold border-r border-black">{job.invoice_number}</td>
                  <td className="p-1.5 bg-gray-100 font-bold w-24 border-r border-black">Tgl Masuk</td>
                  <td className="p-1.5 font-bold">{new Date(job.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1.5 bg-gray-100 font-bold border-r border-black">Pemesan</td>
                  <td className="p-1.5 font-bold border-r border-black">{job.customer_name || 'Pelanggan Umum'}</td>
                  <td className="p-1.5 bg-gray-100 font-bold border-r border-black">Deadline</td>
                  <td className="p-1.5 font-bold underline text-red-700">
                    {job.estimated_done_at ? job.estimated_done_at : 'SECEPATNYA'}
                  </td>
                </tr>
                <tr>
                  <td className="p-1.5 bg-gray-100 font-bold border-r border-black">No. Telepon</td>
                  <td className="p-1.5 font-mono border-r border-black">{cust?.phone || '-'}</td>
                  <td className="p-1.5 bg-gray-100 font-bold border-r border-black">Petugas Kasir</td>
                  <td className="p-1.5">{job.cashier_name || 'Admin'}</td>
                </tr>
              </tbody>
            </table>

            {/* Products */}
            <div className="font-bold text-[11px] uppercase border-b border-black pb-1 mb-2">
              Rincian Item Produk ({items.length} Item):
            </div>

            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="p-2.5 border border-black rounded-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold bg-gray-100 px-1 border border-gray-300 inline-block mb-1">
                        ITEM #{idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-black">{item.product_name}</h4>
                      {item.variant_name && <p className="text-[11px] text-gray-800">Varian: {item.variant_name}</p>}
                      {item.length && item.width && (
                        <p className="text-[11px] font-bold mt-0.5">
                          Dimensi: {item.length} m x {item.width} m (Total: {(item.length * item.width * item.qty).toFixed(1)} m2)
                        </p>
                      )}
                    </div>
                    <div className="text-right border border-black bg-gray-50 px-2.5 py-1 text-center min-w-[90px]">
                      <span className="text-[9px] font-bold text-gray-600 block">JUMLAH</span>
                      <span className="text-base font-black font-mono block leading-none my-0.5">{item.qty}</span>
                      <span className="text-[9px] font-bold uppercase">{item.unit_name || 'Pcs/Buku'}</span>
                    </div>
                  </div>

                  {item.addons && item.addons.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-dashed border-gray-400 text-[11px]">
                      <span className="font-bold block">Finishing / Instruksi Tambahan:</span>
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                        {item.addons.map((a: any, aIdx: number) => (
                          <li key={aIdx}>{a.addon_name} {a.qty > 1 ? `(${a.qty}x)` : ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Checklist */}
            <table className="w-full border-collapse border border-black mt-3 text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left border border-black">Tahapan Pengerjaan</th>
                  <th className="p-1 text-left border border-black w-28">Status</th>
                  <th className="p-1 text-left border border-black w-20">Jam</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 border border-black">[ ] 1. Setting Desain & Layout File</td>
                  <td className="p-1 border border-black">[ ] Selesai</td>
                  <td className="p-1 border border-black">___ : ___</td>
                </tr>
                <tr>
                  <td className="p-1 border border-black">[ ] 2. Cetak Mesin / Kertas</td>
                  <td className="p-1 border border-black">[ ] Selesai</td>
                  <td className="p-1 border border-black">___ : ___</td>
                </tr>
                <tr>
                  <td className="p-1 border border-black">[ ] 3. Finishing, Potong & Jilid</td>
                  <td className="p-1 border border-black">[ ] Selesai</td>
                  <td className="p-1 border border-black">___ : ___</td>
                </tr>
                <tr>
                  <td className="p-1 border border-black">[ ] 4. QC & Packing</td>
                  <td className="p-1 border border-black">[ ] Siap Ambil</td>
                  <td className="p-1 border border-black">___ : ___</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Format cetak bersih & profesional tanpa icon yang mengacaukan kertas.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold skeuo-button text-slate-600 dark:text-slate-400 text-xs rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-md transition-colors"
            >
              Cetak SPK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
