'use client';

import React from 'react';
import { CreditCard, MessageSquare, ArrowRight, Printer, FileText } from 'lucide-react';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';
import { formatRupiah } from '../../utils/format';

interface TrackingCardProps {
  job: any;
  status: OrderStatus;
  customers: Customer[];
  onOpenSettle: (job: any) => void;
  onSendWhatsApp: (job: any) => void;
  onAdvanceStatus: (id: number, currentStatus: OrderStatus) => void;
  onPrintSpk: (job: any) => void;
  onOpenDetail: (job: any) => void;
}

const advanceLabels: Record<OrderStatus, string> = {
  'ANTRIAN': 'Mulai Cetak',
  'PROSES': 'Tandai Selesai',
  'SELESAI': 'Sudah Diambil',
  'DIAMBIL': '',
};

export const TrackingCard: React.FC<TrackingCardProps> = ({
  job,
  status,
  customers,
  onOpenSettle,
  onSendWhatsApp,
  onAdvanceStatus,
  onPrintSpk,
  onOpenDetail,
}) => {
  const isDP = job.payment_status === 'DP' || job.payment_status === 'UNPAID';
  const remaining = Number(job.total_amount) - Number(job.pay_amount);
  const cust = customers.find(c => c.id === job.customer_id);

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
      {/* Header: Invoice & Total */}
      <div className="flex justify-between items-start mb-1.5">
        <button
          type="button"
          onClick={() => onOpenDetail(job)}
          className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-md hover:underline"
          title="Klik untuk lihat detail order & nota"
        >
          {job.invoice_number}
        </button>
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
          {formatRupiah(job.total_amount)}
        </span>
      </div>

      {/* Customer Name & Phone */}
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[160px]">
          {job.customer_name || 'Pelanggan Umum'}
        </h4>
        {cust?.phone && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{cust.phone}</span>
        )}
      </div>

      {/* Tanggal / Deadline */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
        {job.estimated_done_at ? `Deadline: ${job.estimated_done_at}` : `Tgl: ${new Date(job.created_at).toLocaleDateString('id-ID')}`}
      </p>

      {/* Rincian Produk Item List (Menampilkan isi pesanan secara jelas) */}
      <div 
        onClick={() => onOpenDetail(job)}
        className="my-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Klik untuk melihat nota & spesifikasi lengkap"
      >
        {(job.items && job.items.length > 0 ? job.items : [{
          product_name: job.product_name || 'Pesanan Cetak',
          qty: job.qty || 1,
          variant_name: job.variant_name
        }]).slice(0, 2).map((it: any, idx: number) => (
          <div key={idx} className="flex justify-between items-baseline text-[11px]">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-1">
              • {it.product_name}
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0 text-[10px]">
              {it.qty} {it.unit_name || 'pcs'}
            </span>
          </div>
        ))}
        {job.items && job.items.length > 2 && (
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">
            +{job.items.length - 2} item lainnya (klik lihat detail)
          </span>
        )}
      </div>

      {/* Payment Status Badge */}
      <div className="mb-2.5">
        {job.payment_status === 'PAID' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
            Lunas
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
            DP — Sisa {formatRupiah(remaining)}
          </span>
        )}
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2">
        {/* Tombol Cetak SPK (Hanya ada di ANTRIAN dan PROSES) */}
        {(status === 'ANTRIAN' || status === 'PROSES') && (
          <button
            type="button"
            onClick={() => onPrintSpk(job)}
            className="p-1.5 rounded-lg skeuo-button text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
            title="Cetak SPK / Tiket Kerja Operator"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Tombol Detail / Cek Nota (Selalu ada di semua status) */}
        <button
          type="button"
          onClick={() => onOpenDetail(job)}
          className={`p-1.5 rounded-lg skeuo-button text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors ${status === 'DIAMBIL' ? 'flex-1 flex items-center justify-center gap-1 text-xs font-semibold' : ''}`}
          title="Cek Nota & Detail Order"
        >
          <FileText className="w-3.5 h-3.5" />
          {status === 'DIAMBIL' && <span>Cek Nota</span>}
        </button>

        {/* WhatsApp Button (SELESAI only) */}
        {status === 'SELESAI' && (
          <button
            type="button"
            onClick={() => onSendWhatsApp(job)}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center gap-1"
            title="Kirim pesan WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WA</span>
          </button>
        )}

        {/* Lunasi & Serahkan Button (SELESAI + DP only) */}
        {status === 'SELESAI' && isDP && (
          <button
            type="button"
            onClick={() => onOpenSettle(job)}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-200/80 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 transition-colors flex items-center justify-center gap-1"
            title="Lunasi & Serahkan Barang"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Lunasi</span>
          </button>
        )}

        {/* Advance Status Button (Pindah ke Tahap Berikutnya) */}
        {status !== 'DIAMBIL' && (!isDP || status !== 'SELESAI') && (
          <button 
            type="button"
            onClick={() => onAdvanceStatus(job.id, job.order_status)}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 transition-colors shadow-xs"
            title={`Lanjut: ${advanceLabels[status]}`}
          >
            <span>{advanceLabels[status]}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
