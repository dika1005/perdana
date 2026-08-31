/**
 * Pure generator function for Operator Job Ticket (SPK Produksi Cetak).
 * Menghasilkan HTML mandiri dengan layout double-border profesional untuk dicetak di A4/A5.
 */
import { STORE_IDENTITY } from '../../data/storeIdentity';

export function generateJobTicketHtml(job: any, customer: any): string {
  if (!job) return '';

  const custName = customer?.name || job.customer_name || 'Pelanggan Umum';
  const custPhone = customer?.phone || job.customer_phone || '-';
  const cashierName = job.cashier_name || 'Kasir';
  const invoiceNumber = job.invoice_number || '-';
  const orderDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const deadlineDate = job.estimated_done_at
    ? new Date(job.estimated_done_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Menyesuaikan Antrian';

  const items = job.items || [];
  const itemsHtml = items.map((item: any, idx: number) => {
    const isMeterItem = ((item.unit_name || '') + ' ' + (item.product_name || item.name || '')).toLowerCase().includes('meter');
    const dim = (isMeterItem && item.length && item.width) ? `${item.length}m x ${item.width}m (${(item.length * item.width).toFixed(2)} m²)` : '-';
    
    let finishingList: string[] = [];
    if (item.addons && item.addons.length > 0) {
      finishingList = item.addons.map((a: any) => `${a.addon_name || a.name}${a.qty > 1 ? ` (${a.qty}x)` : ''}`);
    }

    return `
      <tr>
        <td style="text-align: center; vertical-align: top; font-weight: bold;">${idx + 1}</td>
        <td style="vertical-align: top;">
          <div style="font-weight: bold; font-size: 13px; color: #000;">${item.product_name || item.name || 'Produk'} ${item.variant_name ? `(${item.variant_name})` : ''}</div>
          ${item.notes ? `<div style="font-size: 11px; color: #333; margin-top: 2px;">Catatan: ${item.notes}</div>` : ''}
        </td>
        <td style="text-align: center; vertical-align: top; font-size: 11px;">${dim}</td>
        <td style="text-align: center; vertical-align: top; font-weight: bold; font-size: 14px;">${item.qty} ${item.unit_name || 'pcs'}</td>
        <td style="vertical-align: top; font-size: 11px;">
          ${finishingList.length > 0 ? finishingList.map(f => `<div>[ ] ${f}</div>`).join('') : '<span style="color: #666;">- Tanpa Finishing Khusus -</span>'}
        </td>
        <td style="text-align: center; vertical-align: top;">
          <div style="width: 16px; height: 16px; border: 1.5px solid #000; margin: 0 auto;"></div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>SPK Produksi - ${invoiceNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px;
            font-size: 12px;
            line-height: 1.35;
          }
          .spk-container {
            width: 100%;
            max-width: 780px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 12px;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-table {
            width: 100%;
            margin-bottom: 12px;
            border: 1px solid #000;
            border-collapse: collapse;
          }
          .meta-table td {
            padding: 5px 8px;
            border: 1px solid #000;
            font-size: 11.5px;
          }
          .content-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          .content-table th {
            background-color: #f0f0f0;
            border: 1.5px solid #000;
            padding: 6px 8px;
            font-size: 11.5px;
            text-align: left;
            text-transform: uppercase;
          }
          .content-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 12px;
          }
          .signatures {
            width: 100%;
            margin-top: 18px;
            border-collapse: collapse;
          }
          .signatures td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            font-size: 11px;
          }
          .sign-box {
            height: 55px;
          }
        </style>
      </head>
      <body>
        <div class="spk-container">
          <table class="header-table">
            <tr>
              <td>
                <div class="title">SURAT PERINTAH KERJA (SPK) PRODUKSI</div>
                <div style="font-size: 11px; font-weight: bold;">${STORE_IDENTITY.name}</div>
                <div style="font-size: 10px; color: #333;">${STORE_IDENTITY.address} | Telp: ${STORE_IDENTITY.phone}</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div style="font-size: 10px; color: #555;">NO. NOTA / ORDER:</div>
                <div style="font-size: 16px; font-weight: bold; font-family: monospace;">${invoiceNumber}</div>
              </td>
            </tr>
          </table>

          <table class="meta-table">
            <tr>
              <td style="width: 50%;"><strong>Nama Pelanggan:</strong> ${custName}</td>
              <td style="width: 50%;"><strong>Tanggal Order:</strong> ${orderDate}</td>
            </tr>
            <tr>
              <td><strong>No. Kontak/WA:</strong> ${custPhone}</td>
              <td style="background-color: #fff9e6;"><strong>TARGET DEADLINE:</strong> <span style="font-size: 13px; font-weight: bold; color: #990000;">${deadlineDate}</span></td>
            </tr>
            <tr>
              <td><strong>Kasir Penerima:</strong> ${cashierName}</td>
              <td><strong>Status Pengerjaan:</strong> ${job.order_status || 'ANTRIAN CETAK'}</td>
            </tr>
          </table>

          <table class="content-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Rincian Nama Produk & Varian</th>
                <th style="width: 130px; text-align: center;">Ukuran Dimensi</th>
                <th style="width: 90px; text-align: center;">Jumlah Qty</th>
                <th style="width: 170px;">Instruksi Finishing</th>
                <th style="width: 50px; text-align: center;">Check</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="6" style="text-align: center; padding: 12px;">(Tidak ada rincian item)</td></tr>'}
            </tbody>
          </table>

          <table class="signatures">
            <tr>
              <td>
                <div>Kasir Penerima</div>
                <div class="sign-box"></div>
                <div>( ${cashierName} )</div>
              </td>
              <td>
                <div>Operator Cetak</div>
                <div class="sign-box"></div>
                <div>( .......................... )</div>
              </td>
              <td>
                <div>Finishing / QC</div>
                <div class="sign-box"></div>
                <div>( .......................... )</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
}
