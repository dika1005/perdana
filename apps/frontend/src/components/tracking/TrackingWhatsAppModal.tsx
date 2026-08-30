'use client';

import React from 'react';
import { X, MessageSquare, Phone, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

interface TrackingWhatsAppModalProps {
  isOpen: boolean;
  job: any | null;
  phone: string;
  onPhoneChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function generateWhatsAppMessage(job: any): string {
  if (!job) return '';
  const customerName = job.customer_name || 'Pelanggan';
  const invoiceNumber = job.invoice_number;
  const totalAmount = Number(job.total_amount) || 0;
  const payAmount = Number(job.paid_amount ?? job.pay_amount) || 0;
  const remaining = Math.max(0, totalAmount - payAmount);
  const isPaid = remaining <= 0 || job.payment_status === 'PAID';

  // Format rincian produk
  let itemsList = '';
  if (job.items && job.items.length > 0) {
    itemsList = job.items.map((it: any) => {
      const dim = (it.length && it.width) ? ` (${it.length}x${it.width}m)` : '';
      const finish = (it.addons && it.addons.length > 0) 
        ? `\n   ↳ Finishing: ${it.addons.map((a: any) => `${a.addon_name || a.name}${a.qty > 1 ? ` (${a.qty}x)` : ''}`).join(', ')}`
        : '';
      return `• ${it.product_name || 'Produk'}${dim} - ${it.qty} ${it.unit_name || 'pcs'}${finish}`;
    }).join('\n');
  }

  let paymentInfo = '';
  if (isPaid) {
    paymentInfo = `💰 *Rincian Pembayaran:*\n• Total Belanja: *${formatRupiah(totalAmount)}*\n• Status: *LUNAS* ✅ (Sudah Dibayar Penuh)\n\n📍 Silakan datang ke toko untuk pengambilan barang. Terima kasih! 🙏`;
  } else {
    paymentInfo = `💰 *Rincian Pembayaran:*\n• Total Belanja: *${formatRupiah(totalAmount)}*\n• Telah Dibayar (DP): *${formatRupiah(payAmount)}*\n⚠️ *Sisa Tagihan yang Harus Dilunasi:* *${formatRupiah(remaining)}*\n• Status: *BELUM LUNAS (Sisa DP)*\n\n📍 Mohon menyiapkan pembayaran sisa tagihan saat pengambilan barang di kasir toko. Terima kasih! 🙏`;
  }

  return `Halo Kak *${customerName}*,\n\nPesanan percetakan Anda dengan nomor nota *${invoiceNumber}* sudah *SELESAI DIKERJAKAN* dan siap diambil di *Percetakan Perdana*.\n\n${itemsList ? `📦 *Rincian Pesanan:*\n${itemsList}\n\n` : ''}${paymentInfo}`;
}

export const TrackingWhatsAppModal: React.FC<TrackingWhatsAppModalProps> = ({
  isOpen,
  job,
  phone,
  onPhoneChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !job) return null;

  const totalAmount = Number(job.total_amount) || 0;
  const payAmount = Number(job.paid_amount ?? job.pay_amount) || 0;
  const remaining = Math.max(0, totalAmount - payAmount);
  const isPaid = remaining <= 0 || job.payment_status === 'PAID';

  const previewMessage = generateWhatsAppMessage(job);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="p-6 sm:p-7 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl my-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Kirim Notifikasi Siap Ambil (WhatsApp)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{job.invoice_number} • <strong className="text-text-main font-sans">{job.customer_name}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Pembayaran Banner */}
        <div className={`p-3 rounded-xl mb-3.5 text-xs flex items-center justify-between border ${
          isPaid 
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {isPaid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {isPaid ? 'Pesanan Sudah Lunas' : `Ada Sisa Tagihan: ${formatRupiah(remaining)}`}
              </p>
              <p className="text-[11px] opacity-80">
                Total: {formatRupiah(totalAmount)} {payAmount > 0 && !isPaid ? `(DP Masuk: ${formatRupiah(payAmount)})` : ''}
              </p>
            </div>
          </div>
          <span className="font-bold font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border border-current">
            {isPaid ? 'LUNAS' : 'SISA DP'}
          </span>
        </div>

        {/* Nomor WhatsApp Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nomor WhatsApp Pelanggan:</span>
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-950">
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={phone}
                onChange={e => onPhoneChange(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs text-text-main font-mono font-bold"
                autoFocus
              />
            </div>
          </div>

          {/* Pratinjau Pesan WA */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Pratinjau Pesan WhatsApp Otomatis:
            </label>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {previewMessage}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-300 text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!phone.trim()}
              onClick={onSubmit}
              className="flex-1 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Kirim ke WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
