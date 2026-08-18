import React from 'react';
import { Bell, Search } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="h-20 px-8 flex items-center justify-between mb-6">
      <div className="flex-1 max-w-xl">
        <div className="flex items-center gap-3 px-4 py-3 skeuo-inset rounded-xl">
          <Search className="w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari transaksi, pelanggan, atau produk..." 
            className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative w-12 h-12 flex items-center justify-center skeuo-button text-text-muted">
          <Bell className="w-5 h-5" />
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-skeuo"></span>
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-white/40">
          <div className="text-right">
            <p className="font-bold text-text-main leading-tight">Admin Kasir</p>
            <p className="text-sm text-text-muted">Superadmin</p>
          </div>
          <div className="w-12 h-12 rounded-xl skeuo overflow-hidden border-2 border-white/50">
            <img src="https://ui-avatars.com/api/?name=Admin+Kasir&background=3b82f6&color=fff" alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};
