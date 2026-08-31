'use client';

import React from 'react';
import { Customer } from '../../types/customer';
import { Printer, FileText } from 'lucide-react';
import { generateJobTicketHtml } from './jobTicketGenerator';
import { STORE_IDENTITY } from '../../data/storeIdentity';
import { Modal, Button } from '../shared';

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
  if (!job) return null;

  const customer = customers.find(c => c.id === job.customer_id);
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = generateJobTicketHtml(job, customer);
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Pratinjau SPK Produksi Operator (Job Ticket)"
      subtitle={<span className="font-mono">{invoiceNumber}</span>}
      icon={<FileText className="w-5 h-5" />}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="primary" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Cetak SPK Operator
          </Button>
        </>
      }
    >
      {/* Screen Sheet Preview */}
      <div className="bg-white text-black p-5 border-2 border-slate-900 rounded-lg shadow-sm text-xs font-sans space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Header Kop SPK */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
          <div>
            <h2 className="text-base font-black tracking-wide text-slate-900 uppercase">
              SURAT PERINTAH KERJA (SPK) PRODUKSI
            </h2>
            <p className="font-bold text-xs text-slate-800">{STORE_IDENTITY.name}</p>
            <p className="text-[10px] text-slate-600">{STORE_IDENTITY.address} | Telp: {STORE_IDENTITY.phone}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">No. Nota / SPK:</span>
            <span className="text-base font-black font-mono text-slate-900">{invoiceNumber}</span>
          </div>
        </div>

        {/* Meta Information */}
        <div className="grid grid-cols-2 gap-2 p-2.5 border border-slate-900 rounded text-xs">
          <div><strong>Pelanggan:</strong> {custName}</div>
          <div><strong>Tanggal Masuk:</strong> {orderDate}</div>
          <div><strong>No. Kontak/WA:</strong> {custPhone}</div>
          <div className="bg-amber-50 p-0.5 rounded font-bold text-amber-900">
            <strong>TARGET SELESAI:</strong> {deadlineDate}
          </div>
          <div><strong>Kasir:</strong> {cashierName}</div>
          <div><strong>Status Antrian:</strong> {job.order_status || 'ANTRIAN CETAK'}</div>
        </div>

        {/* Table Items */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider mb-1.5 text-slate-800">
            Rincian Produk & Instruksi Kerja Operator:
          </h4>
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold text-left">
                <th className="p-2 border-r border-slate-900 w-8 text-center">No</th>
                <th className="p-2 border-r border-slate-900">Nama Produk & Varian</th>
                <th className="p-2 border-r border-slate-900 text-center w-28">Ukuran</th>
                <th className="p-2 border-r border-slate-900 text-center w-20">Qty</th>
                <th className="p-2 border-r border-slate-900">Finishing</th>
                <th className="p-2 text-center w-12">QC</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-slate-400 italic">
                    (Tidak ada rincian item)
                  </td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => {
                  const isMeterItem = ((item.unit_name || '') + ' ' + (item.product_name || item.name || '')).toLowerCase().includes('meter');
                  const dim = (isMeterItem && item.length && item.width) ? `${item.length}m x ${item.width}m` : '-';
                  const finishList = (item.addons || []).map((a: any) => `${a.addon_name || a.name}${a.qty > 1 ? ` (${a.qty}x)` : ''}`);

                  return (
                    <tr key={idx} className="border-b border-slate-900">
                      <td className="p-2 border-r border-slate-900 text-center font-bold">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-900">
                        <p className="font-bold text-slate-900">{item.product_name || item.name || 'Produk'}</p>
                        {item.variant_name && <p className="text-[10px] text-slate-600">Varian: {item.variant_name}</p>}
                      </td>
                      <td className="p-2 border-r border-slate-900 text-center font-mono text-[11px]">{dim}</td>
                      <td className="p-2 border-r border-slate-900 text-center font-black text-sm">{item.qty} {item.unit_name || 'pcs'}</td>
                      <td className="p-2 border-r border-slate-900 text-[11px]">
                        {finishList.length > 0 ? (
                          finishList.map((f: string, fIdx: number) => <div key={fIdx}>[ ] {f}</div>)
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-4 h-4 border border-slate-900 mx-auto"></div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 pt-4 text-center text-[11px]">
          <div>
            <p>Kasir Penerima</p>
            <div className="h-10"></div>
            <p className="font-bold font-mono">({cashierName})</p>
          </div>
          <div>
            <p>Operator Cetak</p>
            <div className="h-10"></div>
            <p className="font-bold font-mono">( .......................... )</p>
          </div>
          <div>
            <p>Finishing / QC</p>
            <div className="h-10"></div>
            <p className="font-bold font-mono">( .......................... )</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
