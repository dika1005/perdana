import React from 'react';
import { Check, MapPin, Phone } from 'lucide-react';
import { PublicStoreInfo } from '../../services/publicService';
import { createWaLink } from '../../utils/whatsapp';

interface CtaBannerProps {
  store?: PublicStoreInfo | null;
  onScrollToCatalog: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = React.memo(({
  store,
  onScrollToCatalog
}) => {
  return (
    <section className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
      <div className="glass-card p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-500/10 border border-blue-200/80 dark:border-blue-800/60 shadow-xl relative overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <Check className="w-3.5 h-3.5" />
              <span>Respon Cepat Jam Kerja</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Punya Kebutuhan Cetak Spesifik atau Grosir?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-medium">
              Konsultasikan kebutuhan spanduk, merchandise, cetak buku nota, atau undangan Anda. Dapatkan penawaran harga khusus untuk pesanan partai besar!
            </p>

            {store && (
              <div className="flex flex-wrap gap-5 pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{store.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{store.phone}</span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
            {store?.phone && (
              <a 
                href={createWaLink(store.phone, 'Halo, saya ingin konsultasi order cetak partai besar / penawaran harga khusus.')}
                target="_blank" 
                rel="noopener noreferrer"
                className="shimmer-btn px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Konsultasi WhatsApp</span>
              </a>
            )}
            <button 
              onClick={onScrollToCatalog}
              className="px-6 py-3.5 rounded-2xl glass-card text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-center text-xs sm:text-sm transition-all cursor-pointer"
            >
              Lihat Katalog Produk
            </button>
          </div>

        </div>
      </div>
    </section>
  );
});

CtaBanner.displayName = 'CtaBanner';
