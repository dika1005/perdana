import React from 'react';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { PublicStoreInfo } from '../../services/publicService';
import { createWaLink } from '../../utils/whatsapp';
import { WorkshopStatusCard } from './WorkshopStatusCard';
import { WaLinkButton } from '../shared';

interface HeroSectionProps {
  store?: PublicStoreInfo | null;
  onScrollToCatalog: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({
  store,
  onScrollToCatalog
}) => {
  return (
    <section className="relative z-10 pt-10 sm:pt-14 lg:pt-16 pb-12 sm:pb-16 px-6 sm:px-10 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-20 items-center">
        
        {/* Left Column: Modern Headline & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Buka hari ini · respon cepat jam kerja</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.14]">
            Layanan Cetak Cepat,{' '}
            <span className="text-blue-600 dark:text-blue-400">
              Hasil Tajam & Presisi
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
            Dari spanduk flexi, stiker die-cut, kartu nama PVC, brosur promosi, hingga undangan & merchandise — harga jujur dan transparan.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button 
              onClick={onScrollToCatalog}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-[background-color,transform,box-shadow] duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <span>Lihat Katalog & Harga</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {store?.phone && (
              <WaLinkButton
                href={createWaLink(store.phone, 'Halo, saya ingin order cetak di Perdana Printing.')}
                className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm hover:scale-[1.02]"
              >
                Order via WhatsApp
              </WaLinkButton>
            )}

            <Link
              href="/cek-pesanan"
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl glass-card text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs sm:text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-transform duration-150"
            >
              <Package className="w-4 h-4 text-blue-500" />
              <span>Lacak Pesanan</span>
            </Link>
          </div>

        </div>

        {/* Right Column: Interactive Workshop Box */}
        <div className="lg:col-span-5">
          <WorkshopStatusCard store={store} />
        </div>

      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';
