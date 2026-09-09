'use client';

import React from 'react';
import { Clock, PackageCheck, Printer, Sparkles } from 'lucide-react';
import { PublicTrackingData } from '../../services/publicService';
import { formatRupiah } from '../../utils/format';
import { createWaLink } from '../../utils/whatsapp';
import { WaLinkButton } from '../shared';

const STEP_CONFIG = [
  { label: 'Antrian Desain / Cetak', desc: 'Pesanan masuk ke antrian produksi', icon: Clock },
  { label: 'Sedang Dicetak', desc: 'Mesin sedang memproses pesanan Anda', icon: Printer },
  { label: 'Selesai — Siap Diambil', desc: 'Barang sudah jadi di outlet kami', icon: Sparkles },
  { label: 'Sudah Diambil', desc: 'Barang telah diserahkan ke pelanggan', icon: PackageCheck },
];

const getStepIndex = (status: string) => {
  switch (status) {
    case 'ANTRIAN': return 0;
    case 'PROSES': return 1;
    case 'SELESAI': return 2;
    case 'DIAMBIL': return 3;
    default: return 0;
  }
};

export interface TrackingResultCardProps {
  data: PublicTrackingData;
}

/** Kartu hasil pelacakan: ringkasan nota, progres stepper, item, dan tagihan. */
export const TrackingResultCard: React.FC<TrackingResultCardProps> = ({ data }) => {
  const currentStep = getStepIndex(data.order_status);

  return (
    <div className="space-y-6 anim-pop">
      <div className="p-6 rounded-2xl skeuo bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          data.order_status === 'DIAMBIL' ? 'bg-emerald-500' :
          data.order_status === 'SELESAI' ? 'bg-purple-500' :
          data.order_status === 'PROSES' ? 'bg-blue-500' :
          'bg-amber-500'
        }`} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No. Nota Transaksi</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.invoice_number}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Atas Nama: <strong className="text-slate-800 dark:text-slate-200">{data.customer_name}</strong> • {new Date(data.created_at).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border shadow-xs ${
              data.payment_status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {data.payment_status === 'PAID' ? 'LUNAS' : 'DP (Belum Lunas)'}
            </span>
          </div>
        </div>

        {/* Progress Stepper Timeline */}
        <div className="py-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Progres Pengerjaan</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {STEP_CONFIG.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              const StepIcon = step.icon;

              return (
                <div key={idx} className={`p-4 rounded-xl border transition-[background-color,color,transform,box-shadow,border-color] ${
                  isCurrent
                    ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 shadow-md ring-2 ring-brand-500/20'
                    : isDone
                    ? 'bg-slate-50/80 dark:bg-slate-900/60 border-emerald-400/60 dark:border-emerald-600/60'
                    : 'bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-brand-600 text-white shadow-sm'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-brand-600 dark:text-brand-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
{/* Order Items Detail */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Item Pesanan</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.map((item, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}
                  </p>
                  {item.addons.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Finishing: {item.addons.join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {item.qty} qty
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Pickup Note */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block">Total Tagihan:</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {formatRupiah(data.total_amount)}
            </span>
            {Number(data.remaining_amount) > 0 && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                Sisa Pembayaran: {formatRupiah(data.remaining_amount)}
              </p>
            )}
          </div>

          <WaLinkButton
            href={createWaLink(
              data.store_phone,
              `Halo CS ${data.store_name}, saya ingin menanyakan progres pesanan dengan No. Nota: ${data.invoice_number} atas nama ${data.customer_name}.`
            )}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs shadow-sm"
          >
            Hubungi CS WhatsApp
          </WaLinkButton>
        </div>
      </div>
    </div>
  );
};