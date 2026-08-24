import React from 'react';
import Link from 'next/link';
import { Printer, Package, Phone, Sun, Moon, LogIn } from 'lucide-react';
import { createWaLink } from '../../utils/whatsapp';

interface LandingNavbarProps {
  storeName?: string;
  storePhone?: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onScrollToCatalog: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = React.memo(({
  storeName = 'Perdana Printing',
  storePhone,
  isDarkMode,
  onToggleTheme,
  onScrollToCatalog
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#090D16]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-3.5 sm:py-4 flex items-center justify-between">
        
        {/* Logo & Store Title */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300">
            <span>P</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                {storeName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                Online POS
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              Digital Printing & Percetakan Profesional
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-300">
          <button 
            onClick={onScrollToCatalog} 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group py-1 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span>Katalog Produk</span>
          </button>
          <Link 
            href="/cek-pesanan"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all group"
          >
            <Package className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-12 transition-transform" />
            <span>Cek Status Pesanan</span>
          </Link>
          {storePhone && (
            <a 
              href={createWaLink(storePhone, `Halo ${storeName}, saya ingin konsultasi produk percetakan.`)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 py-1"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Konsultasi WA</span>
            </a>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/cek-pesanan"
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            title="Cek Pesanan"
          >
            <Package className="w-4 h-4 text-blue-500" />
          </Link>

          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Ganti Tema (Dark / Light)"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <Link 
            href="/login" 
            className="shimmer-btn flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login Kasir</span>
          </Link>
        </div>
      </div>
    </header>
  );
});

LandingNavbar.displayName = 'LandingNavbar';
