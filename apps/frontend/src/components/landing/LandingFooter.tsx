import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Phone, LogIn, ExternalLink } from 'lucide-react';
import { PublicStoreInfo } from '../../services/publicService';
import { createWaLink } from '../../utils/whatsapp';

interface LandingFooterProps {
  store?: PublicStoreInfo | null;
  onScrollToCatalog: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = React.memo(({
  store,
  onScrollToCatalog
}) => {
  const storeName = store?.name || 'Percetakan Perdana';
  const storeAddress = store?.address || 'Ciputat, Kec. Ciawigebang, Kabupaten Kuningan, Jawa Barat 45591';

  return (
    <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 pt-12 pb-8 px-6 sm:px-10 lg:px-16 bg-white/70 dark:bg-[#090D16]/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-slate-200/80 dark:border-slate-800/80">
          
          {/* Column 1: Store Branding & Contact */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/25">
                P
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                  {storeName}
                </h3>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                  Percetakan Digital & Offset Berkualitas
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Melayani cetak spanduk/banner, stiker produk, kartu nama, brosur, kalender, box kemasan, nota, jilid skripsi, hingga souvenir berkualitas dengan pengerjaan cepat dan harga terjangkau.
            </p>

            <div className="space-y-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{storeAddress}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Senin - Sabtu: 08.00 - 17.00 WIB (Minggu Libur)</span>
              </div>
              {store?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <a 
                    href={createWaLink(store.phone)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {store.phone} (WhatsApp)
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <button 
                  onClick={onScrollToCatalog} 
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Katalog & Daftar Harga
                </button>
              </li>
              <li>
                <Link 
                  href="/cek-pesanan" 
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                >
                  Lacak Status Pesanan
                </Link>
              </li>
              <li>
                <a 
                  href="#faq" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                >
                  Bantuan & FAQ
                </a>
              </li>
              <li className="pt-2">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all font-bold"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Portal Kasir POS</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Google Maps Widget */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Lokasi Workshop / Toko</span>
              </h4>
              <a 
                href="https://maps.app.goo.gl/ScZBrW3TXDmgp8LZ7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Embedded Interactive Map Card */}
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-md relative group">
              <iframe
                title="Lokasi Percetakan Perdana"
                src="https://maps.google.com/maps?q=Percetakan+Perdana,+Ciputat,+Ciawigebang,+Kuningan&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="w-full h-44 sm:h-48 border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-2.5 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span className="truncate pr-2">📍 Ciputat, Kec. Ciawigebang, Kuningan</span>
                <a
                  href="https://maps.app.goo.gl/ScZBrW3TXDmgp8LZ7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>Petunjuk Arah</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} <span className="font-bold text-slate-700 dark:text-slate-200">{storeName}</span>. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px]">Sistem Kasir POS & Job Tracking Aktif</span>
          </div>
        </div>

      </div>
    </footer>
  );
});

LandingFooter.displayName = 'LandingFooter';
