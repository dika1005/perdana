'use client';

import React from 'react';
import { CreditCard, ChevronRight, MessageSquare, ArrowRight } from 'lucide-react';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';

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
    <div className="p-4 rounded-xl skeuo-button transition-all">
      {/* Header: Invoice & Total */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono font-bold text-text-muted bg-white/40 dark:bg-black/20 px-2.5 py-1 rounded-lg">
          {job.invoice_number}
        </span>
        <span className="text-xs font-bold text-brand-600">
          Rp {Number(job.total_amount).toLocaleString('id-ID')}
        </span>
      </div>

      {/* Customer Name & Phone */}
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="font-bold text-text-main text-sm">{job.customer_name || 'Pelanggan Umum'}</h4>
        {cust?.phone && (
          <span className="text-[11px] text-text-muted font-mono">{cust.phone}</span>
        )}
      </div>

      {/* Tanggal/Estimasi */}
      <p className="text-xs text-text-muted mb-2">
        {job.estimated_done_at ? `Est. selesai: ${job.estimated_done_at}` : `Tgl: ${new Date(job.created_at).toLocaleDateString('id-ID')}`}
      </p>

      {/* Payment Status Badge */}
      <div className="mb-3">
        {job.payment_status === 'PAID' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✅ LUNAS
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            ⏳ DP — Sisa Rp {remaining.toLocaleString('id-ID')}
          </span>
        )}
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-black/5 dark:border-white/5 pt-3">
        {/* WhatsApp Button (SELESAI only) */}
        {status === 'SELESAI' && (
          <button
            onClick={() => onSendWhatsApp(job)}
            className="flex-1 min-w-0 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
            title="Kirim pesan WhatsApp: Pesanan sudah selesai & siap diambil"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Kirim WA</span>
          </button>
        )}

        {/* Lunasi & Serahkan Button (SELESAI + DP only) */}
        {status === 'SELESAI' && isDP && (
          <button
            onClick={() => onOpenSettle(job)}
            className="flex-1 min-w-0 px-3 py-2 text-xs font-bold rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
            title="Lunasi & Serahkan Barang"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Lunasi</span>
          </button>
        )}

        {/* Advance Status Button — with contextual label text */}
        {status !== 'DIAMBIL' && (!isDP || status !== 'SELESAI') && (
          <button 
            onClick={() => onAdvanceStatus(job.id, job.order_status)}
            className="flex-1 min-w-0 px-3 py-2 text-xs font-bold rounded-lg skeuo-button text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1.5 transition-all"
            title={`Lanjut: ${advanceLabels[status]}`}
          >
            <span>{advanceLabels[status]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
