'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ClipboardList, 
  History, 
  CreditCard, 
  Package, 
  Layers, 
  Users, 
  FileText, 
  UserCog, 
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { authService, UserProfile } from '../../services/authService';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Kasir POS', path: '/pos', icon: ShoppingCart },
  { name: 'Antrian Pesanan', path: '/tracking', icon: ClipboardList },
  { name: 'Riwayat Transaksi', path: '/transactions', icon: History },
  { name: 'Pengeluaran', path: '/expenses', icon: CreditCard },
  { name: 'Master Produk', path: '/products', icon: Package },
  { name: 'Inventaris Bahan', path: '/inventory', icon: Layers },
  { name: 'Pelanggan', path: '/customers', icon: Users },
  { name: 'Laporan', path: '/reports', icon: FileText, superAdminOnly: true },
  { name: 'Kelola Kasir', path: '/users', icon: UserCog, superAdminOnly: true },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // 1. Ambil data user login
    const fetchUser = async () => {
      try {
        const u = await authService.me();
        setUser(u);
      } catch (err) {
        console.error('Sidebar me error:', err);
      }
    };
    fetchUser();

    // 2. Baca preferensi tema
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

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] p-5 flex flex-col skeuo bg-bg-skeuo my-4 ml-4 sticky top-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
          P
        </div>
        <div>
          <h1 className="font-bold text-base text-text-main tracking-tight leading-none">Perdana POS</h1>
          <span className="text-[10px] text-slate-500 font-medium">Percetakan Digital</span>
        </div>
      </div>

      {/* User Role Badge */}
      {user && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
          {isSuperAdmin ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-main truncate leading-tight">{user.name}</p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {isSuperAdmin ? 'SUPER ADMIN / OWNER' : 'KASIR OPERASIONAL'}
            </p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
        {menuItems.map((item) => {
          // Hanya tampilkan menu super admin jika login sebagai SUPER_ADMIN
          if (item.superAdminOnly && !isSuperAdmin) {
            return null;
          }

          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-xs",
                isActive 
                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-auto space-y-2">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all font-medium text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-text-main"
          title="Ganti Tema (Dark/Light)"
        >
          <div className="flex items-center gap-2.5">
            {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
          </div>
          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {isDarkMode ? '🌙 Dark' : '☀️ Light'}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-medium text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};
