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
      {/* Hari Ini — Merah muda + border kiri merah */}
      <div className="skeuo p-5 flex items-center justify-between bg-red-50/40 dark:bg-red-950/10 border-l-4 border-red-400">
        <div>
          <p className="text-xs font-bold text-text-muted">Hari Ini</p>
          <h3 className="text-xl font-bold text-red-500 mt-1">
            Rp {Number(summary?.today_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-red-500">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Bulan Ini — Amber + border kiri amber */}
      <div className="skeuo p-5 flex items-center justify-between bg-amber-50/40 dark:bg-amber-950/10 border-l-4 border-amber-400">
        <div>
          <p className="text-xs font-bold text-text-muted">Bulan Ini</p>
          <h3 className="text-xl font-bold text-amber-500 mt-1">
            Rp {Number(summary?.month_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-amber-500">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      {/* Total Tercatat — Slate/netral */}
      <div className="skeuo p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-text-muted">Total Tercatat</p>
          <h3 className="text-xl font-bold text-text-main mt-1">
            Rp {Number(summary?.total_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-brand-600">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* Jumlah Transaksi — Brand/ungu samar */}
      <div className="skeuo p-5 flex items-center justify-between bg-brand-50/30 dark:bg-brand-950/10">
        <div>
          <p className="text-xs font-bold text-text-muted">Jumlah Catatan</p>
          <h3 className="text-xl font-bold text-text-main mt-1">
            {summary?.total_count || 0} Pengeluaran
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-purple-500">
          <Receipt className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
