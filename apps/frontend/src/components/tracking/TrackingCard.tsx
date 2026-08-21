'use client';

import React from 'react';
import { CreditCard, MessageSquare, ArrowRight } from 'lucide-react';
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
}

// Label tombol sesuai konteks status saat ini
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
}) => {
  const isDP = job.payment_status === 'DP' || job.payment_status === 'UNPAID';
  const remaining = Number(job.total_amount) - Number(job.pay_amount);
  const cust = customers.find(c => c.id === job.customer_id);

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
      {/* Header: Invoice & Total */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-2 py-0.5 rounded-md">
          {job.invoice_number}
        </span>
        <span className="text-xs font-bold text-text-main font-mono">
          {formatRupiah(job.total_amount)}
        </span>
      </div>

      {/* Customer Name & Phone */}
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="font-semibold text-text-main text-xs">{job.customer_name || 'Pelanggan Umum'}</h4>
        {cust?.phone && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{cust.phone}</span>
        )}
      </div>

      {/* Tanggal/Estimasi */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
        {job.estimated_done_at ? `Est: ${job.estimated_done_at}` : `Tgl: ${new Date(job.created_at).toLocaleDateString('id-ID')}`}
      </p>

      {/* Payment Status Badge */}
      <div className="mb-3">
        {job.payment_status === 'PAID' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
            Lunas
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
            DP — Sisa {formatRupiah(remaining)}
          </span>
        )}
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
        {/* WhatsApp Button (SELESAI only) */}
        {status === 'SELESAI' && (
          <button
            onClick={() => onSendWhatsApp(job)}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center gap-1"
            title="Kirim pesan WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Kirim WA</span>
          </button>
        )}

        {/* Lunasi & Serahkan Button (SELESAI + DP only) */}
        {status === 'SELESAI' && isDP && (
          <button
            onClick={() => onOpenSettle(job)}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-200/80 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/60 transition-colors flex items-center justify-center gap-1"
            title="Lunasi & Serahkan Barang"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Lunasi</span>
          </button>
        )}

        {/* Advance Status Button */}
        {status !== 'DIAMBIL' && (!isDP || status !== 'SELESAI') && (
          <button 
            onClick={() => onAdvanceStatus(job.id, job.order_status)}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center gap-1 transition-colors"
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
