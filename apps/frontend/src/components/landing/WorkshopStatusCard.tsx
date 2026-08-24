import React from 'react';
import { Printer, MapPin, Phone, CheckCircle2, MessageSquare, Star } from 'lucide-react';
import { PublicStoreInfo } from '../../services/publicService';
import { createWaLink } from '../../utils/whatsapp';

interface WorkshopStatusCardProps {
  store?: PublicStoreInfo | null;
}

export const WorkshopStatusCard: React.FC<WorkshopStatusCardProps> = React.memo(({ store }) => {
  return (
    <div className="relative">
      {/* Floating rating badge */}
      <div className="absolute -top-4 -left-4 z-20 glass-card px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 border border-amber-300/40 dark:border-amber-500/30 animate-float-slow">
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
          <Star className="w-3.5 h-3.5 fill-amber-500" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-900 dark:text-white leading-none">4.9 / 5.0</p>
          <p className="text-[10px] text-slate-500 font-medium">Kepuasan Pelanggan</p>
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 relative overflow-hidden shadow-xl">
        
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Workshop Percetakan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Siap melayani pesanan Anda</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Buka Setiap Hari
          </span>
        </div>

        {/* Store Details Box */}
        {store && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 flex items-start gap-3 border border-slate-200/60 dark:border-slate-700/60">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Workshop</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{store.address}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 flex items-start gap-3 border border-slate-200/60 dark:border-slate-700/60">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontak WhatsApp</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{store.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Design File Check Offer */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800/50 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cek Kelayakan File Desain Gratis</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Kirim file PDF/CDR/AI/JPG ke admin untuk kami pastikan resolusinya tajam dan tidak pecah sebelum dicetak.
          </p>
        </div>

        {store?.phone && (
          <a 
            href={createWaLink(store.phone, 'Halo, saya mau konsultasi dan kirim file desain.')}
            target="_blank"
            rel="noopener noreferrer"
            className="shimmer-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-center text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim File via WhatsApp</span>
          </a>
        )}

      </div>
    </div>
  );
});

WorkshopStatusCard.displayName = 'WorkshopStatusCard';
