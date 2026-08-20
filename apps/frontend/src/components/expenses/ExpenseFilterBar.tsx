'use client';

import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
import { ExpenseCategory, ExpensePaymentMethod } from '../../types/expense';

interface ExpenseFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  filterCategory: ExpenseCategory | '';
  onFilterCategoryChange: (val: ExpenseCategory | '') => void;
  filterPayment: ExpensePaymentMethod | '';
  onFilterPaymentChange: (val: ExpensePaymentMethod | '') => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onResetFilters: () => void;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  filterCategory,
  onFilterCategoryChange,
  filterPayment,
  onFilterPaymentChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
}) => {
  const hasActiveFilter = Boolean(searchTerm || filterCategory || filterPayment || startDate || endDate);

  return (
    <div className="skeuo p-4 mb-6 flex flex-wrap gap-3 items-center justify-between">
      <form onSubmit={onSearchSubmit} className="flex-1 min-w-[240px] flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 skeuo-inset rounded-xl">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Cari keterangan atau catatan pengeluaran..."
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-text-main"
          />
        </div>
        <button type="submit" className="px-4 py-2 font-bold skeuo-button text-text-main text-xs">
          Cari
        </button>
      </form>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Kategori Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 skeuo-inset rounded-xl text-xs text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={filterCategory}
            onChange={e => onFilterCategoryChange(e.target.value as ExpenseCategory | '')}
            className="bg-transparent border-none outline-none text-xs text-text-main"
          >
            <option value="">Semua Kategori</option>
            <option value="BAHAN_BAKU">Bahan Baku & Tinta</option>
            <option value="OPERASIONAL">Operasional Harian</option>
            <option value="MAINTENANCE">Maintenance Mesin</option>
            <option value="GAJI">Gaji & Upah</option>
            <option value="LAINNYA">Lain-lain</option>
          </select>
        </div>

        {/* Metode Bayar Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 skeuo-inset rounded-xl text-xs text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={filterPayment}
            onChange={e => onFilterPaymentChange(e.target.value as ExpensePaymentMethod | '')}
            className="bg-transparent border-none outline-none text-xs text-text-main"
          >
            <option value="">Semua Metode</option>
            <option value="CASH">Tunai (Cash)</option>
            <option value="TRANSFER">Transfer Bank</option>
          </select>
        </div>

        {/* Rentang Tanggal */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 skeuo-inset rounded-xl text-xs text-text-muted">
          <Calendar className="w-3.5 h-3.5" />
          <input
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main"
            title="Tanggal Mulai"
          />
          <span>-</span>
          <input
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main"
            title="Tanggal Akhir"
          />
        </div>

        {hasActiveFilter && (
          <button
            onClick={onResetFilters}
            className="p-2 skeuo-button text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
            title="Reset Filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
