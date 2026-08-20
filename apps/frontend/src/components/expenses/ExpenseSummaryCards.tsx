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
      <div className="skeuo p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-text-muted">Kas Keluar Hari Ini</p>
          <h3 className="text-xl font-bold text-red-500 mt-1">
            Rp {Number(summary?.today_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-red-500">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="skeuo p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-text-muted">Kas Keluar Bulan Ini</p>
          <h3 className="text-xl font-bold text-amber-500 mt-1">
            Rp {Number(summary?.month_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-amber-500">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      <div className="skeuo p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-text-muted">Total Pengeluaran Tercatat</p>
          <h3 className="text-xl font-bold text-text-main mt-1">
            Rp {Number(summary?.total_amount || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-brand-600">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      <div className="skeuo p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-text-muted">Jumlah Pengeluaran</p>
          <h3 className="text-xl font-bold text-text-main mt-1">
            {summary?.total_count || 0} Transaksi
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-purple-500">
          <Receipt className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
