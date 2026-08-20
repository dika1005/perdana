'use client';

import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
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
        <div className="flex-1 flex items-center gap-2 px-3 py-2 skeuo-inset rounded-xl">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Cari No. Nota atau Nama Pelanggan..."
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
        {/* Tanggal */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 skeuo-inset rounded-xl text-xs text-text-muted">
          <Calendar className="w-3.5 h-3.5" />
          <input
            type="date"
            value={filterDate}
            onChange={e => onFilterDateChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-main"
          />
        </div>

        {/* Filter Status Bayar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 skeuo-inset rounded-xl text-xs text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={filterPayment}
            onChange={e => onFilterPaymentChange(e.target.value as PaymentStatus | '')}
            className="bg-transparent border-none outline-none text-xs text-text-main"
          >
            <option value="">Semua Bayar</option>
            <option value="PAID">Lunas</option>
            <option value="DP">DP (Uang Muka)</option>
            <option value="UNPAID">Belum Bayar</option>
          </select>
        </div>

        {/* Filter Status Produksi */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 skeuo-inset rounded-xl text-xs text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={filterOrder}
            onChange={e => onFilterOrderChange(e.target.value as OrderStatus | '')}
            className="bg-transparent border-none outline-none text-xs text-text-main"
          >
            <option value="">Semua Status Produksi</option>
            <option value="ANTRIAN">Antrian</option>
            <option value="PROSES">Proses Cetak</option>
            <option value="SELESAI">Selesai</option>
            <option value="DIAMBIL">Telah Diambil</option>
          </select>
        </div>

        {hasActiveFilter && (
          <button
            onClick={onResetFilters}
            className="p-2 skeuo-button text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
            title="Reset semua filter"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
