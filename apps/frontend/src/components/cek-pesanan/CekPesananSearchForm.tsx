'use client';

import React from 'react';
import { Search } from 'lucide-react';

export interface CekPesananSearchFormProps {
  queryInput: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
}

/** Form pencarian status pesanan berdasarkan nomor nota / no. WhatsApp. */
export const CekPesananSearchForm: React.FC<CekPesananSearchFormProps> = ({
  queryInput,
  onQueryChange,
  onSubmit,
  loading,
}) => (
  <form onSubmit={onSubmit} className="mb-8">
    <div className="p-2 rounded-2xl skeuo bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-2 shadow-md">
      <div className="relative flex-1 flex items-center">
        <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          required
          value={queryInput}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Contoh: INV-20260821-1234 atau 081234567890"
          className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="py-3 px-7 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-xs tracking-wide shadow-md shadow-brand-500/25 transition-[background-color,color,transform,box-shadow,border-color] flex items-center justify-center gap-2"
      >
        {loading ? (
          <span>Mencari...</span>
        ) : (
          <>
            <Search className="w-4 h-4" />
            <span>Cek Status</span>
          </>
        )}
      </button>
    </div>
  </form>
);