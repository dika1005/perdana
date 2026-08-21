'use client';

import React from 'react';
import { Wallet, TrendingDown, Clock, Receipt } from 'lucide-react';
import { ExpenseSummary } from '../../types/expense';

interface ExpenseSummaryCardsProps {
  summary: ExpenseSummary | null;
}

export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Hari Ini */}
      <div className="skeuo p-5 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pengeluaran Hari Ini</p>
          <h3 className="text-xl font-bold text-text-main mt-1 font-mono tracking-tight">
            Rp {Number(summary?.today_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 bg-rose-50 border border-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/50 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Bulan Ini */}
      <div className="skeuo p-5 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pengeluaran Bulan Ini</p>
          <h3 className="text-xl font-bold text-text-main mt-1 font-mono tracking-tight">
            Rp {Number(summary?.month_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 bg-amber-50 border border-amber-100 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50 shrink-0">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      {/* Total Tercatat */}
      <div className="skeuo p-5 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pengeluaran</p>
          <h3 className="text-xl font-bold text-text-main mt-1 font-mono tracking-tight">
            Rp {Number(summary?.total_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/50 shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* Jumlah Transaksi */}
      <div className="skeuo p-5 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Jumlah Catatan</p>
          <h3 className="text-xl font-bold text-text-main mt-1">
            {summary?.total_count || 0} Transaksi
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 bg-purple-50 border border-purple-100 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/50 shrink-0">
          <Receipt className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
