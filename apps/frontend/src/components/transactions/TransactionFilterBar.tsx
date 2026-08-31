'use client';

import React from 'react';
import { Search, Calendar, Wallet, ClipboardList, X, CreditCard } from 'lucide-react';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../types/transaction';

interface TransactionFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  filterDate: string;
  onFilterDateChange: (val: string) => void;
  filterPayment: PaymentStatus | '';
  onFilterPaymentChange: (val: PaymentStatus | '') => void;
  filterPaymentMethod?: PaymentMethod | '';
  onFilterPaymentMethodChange?: (val: PaymentMethod | '') => void;
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
  filterPaymentMethod = '',
  onFilterPaymentMethodChange,
  filterOrder,
  onFilterOrderChange,
  onResetFilters,
}) => {
  const hasActiveFilter = Boolean(searchTerm || filterDate || filterPayment || filterPaymentMethod || filterOrder);

  return (
    <div className="skeuo p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
      <form onSubmit={onSearchSubmit} className="flex-1 min-w-[240px] flex gap-2">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Cari No. Nota atau Nama Pelanggan..."
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-slate-400 font-medium"
          />
        </div>
        <button type="submit" className="px-4 py-2 font-semibold skeuo-button text-text-main text-xs rounded-xl">
          Cari
        </button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Tanggal */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={e => onFilterDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main font-medium cursor-pointer"
          />
        </div>

        {/* Filter Status Bayar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <select
            value={filterPayment}
            onChange={e => onFilterPaymentChange(e.target.value as PaymentStatus | '')}
            className="bg-transparent border-none outline-none text-xs text-text-main font-medium cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
          >
            <option value="">Status: Semua</option>
            <option value="PAID">Lunas</option>
            <option value="DP">DP (Uang Muka)</option>
            <option value="UNPAID">Belum Bayar</option>
          </select>
        </div>

        {/* Filter Metode Bayar */}
        {onFilterPaymentMethodChange && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <select
              value={filterPaymentMethod}
              onChange={e => onFilterPaymentMethodChange(e.target.value as PaymentMethod | '')}
              className="bg-transparent border-none outline-none text-xs text-text-main font-medium cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
            >
              <option value="">Metode: Semua</option>
              <option value="CASH">💵 Tunai (Cash)</option>
              <option value="QRIS">📱 QRIS</option>
              <option value="TRANSFER">🏦 Transfer Bank</option>
            </select>
          </div>
        )}

        {/* Filter Status Produksi */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <ClipboardList className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <select
            value={filterOrder}
            onChange={e => onFilterOrderChange(e.target.value as OrderStatus | '')}
            className="bg-transparent border-none outline-none text-xs text-text-main font-medium cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
          >
            <option value="">Produksi: Semua</option>
            <option value="ANTRIAN">Antrian Cetak</option>
            <option value="PROSES">Sedang Diproses</option>
            <option value="SELESAI">Selesai</option>
            <option value="DIAMBIL">Sudah Diambil</option>
            <option value="BATAL">Dibatalkan</option>
          </select>
        </div>

        {hasActiveFilter && (
          <button
            onClick={onResetFilters}
            className="p-2 skeuo-button text-rose-500 hover:text-rose-600 rounded-xl transition-colors"
            title="Reset semua filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
