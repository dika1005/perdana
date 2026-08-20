'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  LogOut, 
  ClipboardList, 
  History, 
  Tag, 
  UserCog, 
  Wallet,
  Sun, 
  Moon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authService, UserProfile } from '../../services/authService';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  superAdminOnly?: boolean;
}

const allMenuItems: MenuItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', superAdminOnly: true },
  { name: 'Kasir POS', icon: ShoppingCart, path: '/pos' },
  { name: 'Job Tracking', icon: ClipboardList, path: '/tracking' },
  { name: 'Riwayat Transaksi', icon: History, path: '/transactions' },
  { name: 'Kas Keluar', icon: Wallet, path: '/expenses' },
  { name: 'Master Produk', icon: Tag, path: '/products', superAdminOnly: true },
  { name: 'Inventaris Bahan', icon: Package, path: '/inventory', superAdminOnly: true },
  { name: 'Pelanggan', icon: Users, path: '/customers' },
  { name: 'Laporan', icon: FileText, path: '/reports', superAdminOnly: true },
  { name: 'Kelola Kasir', icon: UserCog, path: '/users', superAdminOnly: true },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // 1. Theme sync
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // 2. Fetch logged in user profile
    const fetchMe = async () => {
      try {
        const u = await authService.me();
        setUser(u);

        // Client-side route protection for Kasir (ADMIN)
        if (u.role === 'ADMIN') {
          const restrictedPaths = ['/dashboard', '/reports', '/users', '/products', '/inventory'];
          if (restrictedPaths.includes(pathname)) {
            router.replace('/pos');
          }
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchMe();
  }, [pathname, router]);

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

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const menuItems = allMenuItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] p-6 flex flex-col skeuo bg-bg-skeuo my-4 ml-4 sticky top-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="w-10 h-10 rounded-xl skeuo flex items-center justify-center text-brand-500 font-bold text-xl">
          P
        </div>
        <div>
          <h1 className="font-bold text-lg text-text-main tracking-tight leading-none">Perdana POS</h1>
          <span className="text-[10px] text-text-muted font-medium">Percetakan Digital</span>
        </div>
      </div>

      {/* User Role Badge */}
      {user && (
        <div className="mb-4 px-3 py-2 rounded-xl skeuo-inset flex items-center gap-2.5">
          {isSuperAdmin ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <UserCheck className="w-4 h-4 text-brand-500 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-main truncate leading-tight">{user.name}</p>
            <p className="text-[10px] font-semibold text-text-muted">
              {isSuperAdmin ? 'SUPER ADMIN / OWNER' : 'KASIR OPERASIONAL'}
            </p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm",
                isActive 
                  ? "skeuo-inset text-brand-600 font-bold" 
                  : "skeuo-button text-text-muted hover:text-text-main"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-3 border-t border-black/5 dark:border-white/10 mt-auto space-y-2">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl w-full transition-all duration-200 font-semibold text-sm skeuo-button text-text-main"
          title="Ganti Tema (Dark/Light)"
        >
          <div className="flex items-center gap-2.5">
            {isDarkMode ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span className="text-xs">{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded skeuo-inset text-text-muted">
            {isDarkMode ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full transition-all duration-200 font-semibold text-sm skeuo-button text-red-500 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs">Keluar</span>
        </button>
      </div>
    </aside>
  );
};
