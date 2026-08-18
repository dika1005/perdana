'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, LogOut, ClipboardList, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authService } from '../../services/authService';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Kasir POS', icon: ShoppingCart, path: '/pos' },
  { name: 'Job Tracking', icon: ClipboardList, path: '/tracking' },
  { name: 'Inventaris', icon: Package, path: '/inventory' },
  { name: 'Pelanggan', icon: Users, path: '/customers' },
  { name: 'Laporan', icon: FileText, path: '/reports' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] p-6 flex flex-col skeuo bg-bg-skeuo my-4 ml-4 sticky top-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl skeuo flex items-center justify-center text-brand-500 font-bold text-xl">
          P
        </div>
        <h1 className="font-bold text-xl text-text-main tracking-tight">Perdana POS</h1>
      </div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm",
                isActive 
                  ? "skeuo-inset text-brand-600 font-bold" 
                  : "skeuo-button text-text-muted hover:text-text-main"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-black/5 dark:border-white/10 mt-auto space-y-3">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-4 py-3 rounded-xl w-full transition-all duration-200 font-semibold text-sm skeuo-button text-text-main"
          title="Ganti Tema (Dark/Light)"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="w-5 h-5 text-brand-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded skeuo-inset text-text-muted">
            {isDarkMode ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-200 font-semibold text-sm skeuo-button text-red-500 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};
