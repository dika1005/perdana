'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { BackLink } from './BackLink';
import { ThemeToggleButton } from './ThemeToggleButton';

export interface PublicNavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  backHref?: string;
  backLabel?: string;
  brandName?: string;
}

/** Navbar untuk halaman publik: tautan kembali + merk + alih tema. */
export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  isDark,
  onToggleTheme,
  backHref = '/',
  backLabel = 'Kembali ke Beranda',
  brandName = 'PERDANA PRINTING',
}) => (
  <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <BackLink
        href={backHref}
        label={backLabel}
        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors"
      />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
          <Printer className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white hidden sm:inline">
          {brandName}
        </span>
      </div>

      <ThemeToggleButton
        isDark={isDark}
        onToggle={onToggleTheme}
        className="p-2 rounded-xl skeuo-button text-slate-600 dark:text-slate-300 hover:text-slate-900"
      />
    </div>
  </header>
);