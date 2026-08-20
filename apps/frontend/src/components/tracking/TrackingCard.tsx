'use client';

import React from 'react';
import { CreditCard, ChevronRight, MessageSquare } from 'lucide-react';
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
    <div className="p-4 rounded-xl skeuo-button transition-all text-xs">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-mono font-bold text-text-muted bg-white/40 dark:bg-black/20 px-2 py-0.5 rounded">
          {job.invoice_number}
        </span>
        <span className="text-[11px] font-bold text-brand-600">
          Rp {Number(job.total_amount).toLocaleString('id-ID')}
        </span>
      </div>

      <div className="flex justify-between items-baseline mb-1">
        <h4 className="font-bold text-text-main text-sm">{job.customer_name || 'Pelanggan Umum'}</h4>
        {cust?.phone && (
          <span className="text-[10px] text-text-muted font-mono">{cust.phone}</span>
        )}
      </div>

      <p className="text-[11px] text-text-muted mb-3">
        {job.estimated_done_at ? `Est. Selesai: ${job.estimated_done_at}` : `Tgl: ${new Date(job.created_at).toLocaleDateString('id-ID')}`}
      </p>
      
      {/* Action Bar */}
      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2.5 mt-2">
        <span className={`font-bold text-[11px] ${job.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {job.payment_status === 'PAID' ? 'LUNAS' : `DP (Sisa Rp ${remaining.toLocaleString('id-ID')})`}
        </span>
        
        <div className="flex items-center gap-1.5">
          {/* WhatsApp Trigger Button on SELESAI */}
          {status === 'SELESAI' && (
            <button
              onClick={() => onSendWhatsApp(job)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
              title="Kirim pesan WhatsApp: Pesanan sudah selesai & siap diambil"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Kirim WA</span>
            </button>
          )}

          {status === 'SELESAI' && isDP && (
            <button
              onClick={() => onOpenSettle(job)}
              className="px-2.5 py-1 text-[11px] font-bold skeuo-button text-amber-600 flex items-center gap-1"
              title="Lunasi & Serahkan Barang"
            >
              <CreditCard className="w-3 h-3" />
              Lunasi & Serahkan
            </button>
          )}

          {status !== 'DIAMBIL' && (!isDP || status !== 'SELESAI') && (
            <button 
              onClick={() => onAdvanceStatus(job.id, job.order_status)}
              className="w-7 h-7 rounded-lg skeuo-inset flex items-center justify-center text-brand-600 hover:text-brand-700 transition-colors"
              title="Lanjut ke tahap berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
