'use client';

import React from 'react';
import { Search, Calendar, Wallet, ClipboardList, X } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '../../types/transaction';

interface TransactionFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  filterDate: string;
  onFilterDateChange: (val: string) => void;
  filterPayment: PaymentStatus | '';
  onFilterPaymentChange: (val: PaymentStatus | '') => void;
  filterOrder: OrderStatus | '';
  onFilterOrderChange: (val: OrderStatus | '') => void;
  onResetFilters: () => void;
}

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  filterDate,
  onFilterDateChange,
  filterPayment,
  onFilterPaymentChange,
  filterOrder,
  onFilterOrderChange,
  onResetFilters,
}) => {
  const hasActiveFilter = Boolean(searchTerm || filterDate || filterPayment || filterOrder);

  return (
    <div className="skeuo p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
      <form onSubmit={onSearchSubmit} className="flex-1 min-w-[240px] flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 skeuo-inset rounded-xl">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Cari No. Nota atau Nama Pelanggan..."
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-text-main placeholder:text-text-muted/60"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 font-bold skeuo-button text-text-main text-sm rounded-xl">
          Cari
        </button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Tanggal */}
        <div className="flex items-center gap-1.5 px-3 py-2 skeuo-inset rounded-xl text-sm text-text-muted">
          <Calendar className="w-4 h-4 text-brand-500" />
          <input
            type="date"
            value={filterDate}
            onChange={e => onFilterDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text-main"
          />
        </div>

        {/* Filter Status Bayar — ikon Wallet */}
        <div className="flex items-center gap-1.5 px-3 py-2 skeuo-inset rounded-xl text-sm text-text-muted">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <select
            value={filterPayment}
            onChange={e => onFilterPaymentChange(e.target.value as PaymentStatus | '')}
            className="bg-transparent border-none outline-none text-sm text-text-main"
          >
            <option value="">Status Bayar ▾</option>
            <option value="PAID">✅ Lunas</option>
            <option value="DP">⏳ DP (Uang Muka)</option>
            <option value="UNPAID">❌ Belum Bayar</option>
          </select>
        </div>

        {/* Filter Status Produksi — ikon ClipboardList */}
        <div className="flex items-center gap-1.5 px-3 py-2 skeuo-inset rounded-xl text-sm text-text-muted">
          <ClipboardList className="w-4 h-4 text-amber-500" />
          <select
            value={filterOrder}
            onChange={e => onFilterOrderChange(e.target.value as OrderStatus | '')}
            className="bg-transparent border-none outline-none text-sm text-text-main"
          >
            <option value="">Status Pesanan ▾</option>
            <option value="ANTRIAN">🕐 Antrian</option>
            <option value="PROSES">🔄 Proses Cetak</option>
            <option value="SELESAI">✅ Selesai</option>
            <option value="DIAMBIL">📦 Sudah Diambil</option>
          </select>
        </div>

        {hasActiveFilter && (
          <button
            onClick={onResetFilters}
            className="p-2.5 skeuo-button text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Reset semua filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
