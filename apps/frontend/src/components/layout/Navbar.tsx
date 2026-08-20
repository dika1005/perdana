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
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin / Owner' : 'Kasir';
  const avatarName = encodeURIComponent(displayName);

  return (
    <header className="h-16 px-6 sm:px-8 lg:px-10 flex items-center justify-between mb-2">
      <div className="flex-1 max-w-xl">
        <div className="flex items-center gap-3 px-4 py-3 skeuo-inset rounded-xl">
          <Search className="w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari transaksi, nota invoice, pelanggan..." 
            className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative w-11 h-11 flex items-center justify-center skeuo-button text-text-muted rounded-xl">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3.5 pl-4 border-l border-white/20">
          <div className="text-right">
            <p className="font-bold text-text-main text-sm leading-tight">{displayName}</p>
            <p className="text-xs text-brand-600 font-semibold">{roleLabel}</p>
          </div>
          <div className="w-10 h-10 rounded-xl skeuo overflow-hidden border border-white/30 flex items-center justify-center font-bold text-sm text-brand-600 bg-brand-50">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
