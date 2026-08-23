'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, PackageCheck, CreditCard, CheckCircle2 } from 'lucide-react';
import { authService, UserProfile } from '../../services/authService';
import { reportService } from '../../services/reportService';
import { DashboardSummary, LowStockItem } from '../../types/report';

export const Navbar = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await authService.me();
        setUser(u);
      } catch (err) {
        console.error('Navbar failed to fetch user:', err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const [sum, low] = await Promise.all([
          reportService.getSummary(),
          reportService.getLowStock().catch(() => [])
        ]);
        setSummary(sum);
        setLowStockItems(low || []);
      } catch (err) {
        console.error('Navbar failed to fetch notifications:', err);
      }
    };

    fetchUser();
    fetchNotifications();

    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name || 'Kasir Percetakan';
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin / Owner' : 'Kasir Operasional';

  // Hitung total notifikasi aktif
  const lowStockCount = lowStockItems.length;
  const readyOrdersCount = summary?.ready_orders || 0;
  const piutangCount = (summary?.dp_transactions || 0) + (summary?.unpaid_transactions || 0);
  const totalAlerts = lowStockCount + (readyOrdersCount > 0 ? 1 : 0) + (piutangCount > 0 ? 1 : 0);

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-end mb-2">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notification Bell Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer"
            title="Pusat Notifikasi & Peringatan"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {totalAlerts}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-xs text-text-main">Pusat Notifikasi</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {totalAlerts > 0 ? `${totalAlerts} Perlu Perhatian` : 'Semua Aman'}
                </span>
              </div>

              <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                {/* 1. Alert Stok Bahan Baku Menipis */}
                {lowStockCount > 0 ? (
                  <Link 
                    href="/inventory" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-900/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-xs text-rose-900 dark:text-rose-200">Stok Bahan Menipis</p>
                        <span className="text-[10px] font-bold bg-rose-200/80 dark:bg-rose-800 text-rose-800 dark:text-rose-100 px-1.5 py-0.2 rounded">
                          {lowStockCount} Item
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 truncate">
                        {lowStockItems.map(i => i.name).slice(0, 2).join(', ')}{lowStockCount > 2 ? '...' : ''}
                      </p>
                      <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 mt-1 inline-flex items-center gap-1 group-hover:underline">
                        Buka Inventaris &rarr;
                      </span>
                    </div>
                  </Link>
                ) : null}

                {/* 2. Alert Pesanan Siap Diambil */}
                {readyOrdersCount > 0 ? (
                  <Link 
                    href="/tracking" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200/80 dark:border-purple-900/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-xs text-purple-900 dark:text-purple-200">Pesanan Siap Diambil</p>
                        <span className="text-[10px] font-bold bg-purple-200/80 dark:bg-purple-800 text-purple-800 dark:text-purple-100 px-1.5 py-0.2 rounded">
                          {readyOrdersCount} Pesanan
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                        Pesanan telah selesai dicetak dan menunggu diambil pelanggan.
                      </p>
                      <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 mt-1 inline-flex items-center gap-1 group-hover:underline">
                        Lihat Antrian &rarr;
                      </span>
                    </div>
                  </Link>
                ) : null}

                {/* 3. Alert Piutang / Tagihan Tertunggak */}
                {piutangCount > 0 ? (
                  <Link 
                    href="/reports" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-900/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-xs text-amber-900 dark:text-amber-200">Piutang Belum Lunas</p>
                        <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-800 text-amber-800 dark:text-amber-100 px-1.5 py-0.2 rounded font-mono">
                          Rp {Number(summary?.total_piutang || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                        Terdapat {piutangCount} transaksi DP atau belum lunas.
                      </p>
                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1 inline-flex items-center gap-1 group-hover:underline">
                        Cek Laporan Piutang &rarr;
                      </span>
                    </div>
                  </Link>
                ) : null}

                {/* 4. Keadaan Normal (Tidak ada alert) */}
                {totalAlerts === 0 && (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-xs text-text-main">Tidak Ada Peringatan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semua stok bahan aman dan tidak ada pesanan tertunda.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
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
