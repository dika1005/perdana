'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { authService, UserProfile } from '../../services/authService';

export const Navbar = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await authService.me();
        setUser(u);
      } catch (err) {
        console.error('Navbar failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  const displayName = user?.name || 'Kasir Percetakan';
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin / Owner' : 'Kasir Operasional';

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-2">
      <div className="flex-1 max-w-xl">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Cari transaksi, nota invoice, pelanggan..." 
            className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-slate-400 text-xs font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button 
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-text-main text-xs leading-tight">{displayName}</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{roleLabel}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
