'use client';

import React from 'react';
import { Search, Package, AlertTriangle, ArrowUpRight, Layers, ArrowUpDown } from 'lucide-react';
import { RawMaterial } from '../../types/rawMaterial';
import { Category } from '../../types/category';

interface InventoryTableProps {
  materials: RawMaterial[];
  categories: Category[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: number | undefined;
  onSelectCategory: (val: number | undefined) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpenRestock: (item: RawMaterial) => void;
  onOpenLots?: (item: RawMaterial) => void;
  onOpenUom?: (item: RawMaterial) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  materials,
  categories,
  loading,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onSearchSubmit,
  onOpenRestock,
  onOpenLots,
  onOpenUom,
}) => {
  return (
    <div className="skeuo p-6">
      <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Cari nama bahan baku..." 
            className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-slate-400 text-xs font-medium"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory || ''} 
          onChange={e => onSelectCategory(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3.5 py-2 font-medium text-text-main outline-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
        >
          <option value="">Semua Kategori Bahan</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 font-semibold skeuo-button text-text-main text-xs rounded-xl cursor-pointer">
          Cari
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Bahan</th>
              <th className="py-3 px-4">Varian</th>
              <th className="py-3 px-4">Stok Fisik</th>
              <th className="py-3 px-4">Terkunci (Reserved)</th>
              <th className="py-3 px-4">Tersedia (Free)</th>
              <th className="py-3 px-4">Batas Min</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                  Memuat data bahan baku...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                  Belum ada data bahan baku di database.
                </td>
              </tr>
            ) : (
              materials.map(item => {
                const isRollOrArea = (item.unit || '').toLowerCase().includes('meter') || (item.unit || '').toLowerCase().includes('m2') || (item.unit || '').toLowerCase().includes('sqm') || Number(item.roll_width || 0) > 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-xs text-text-main flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <span>{item.name}</span>
                        {item.roll_width && (
                          <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-mono font-medium">
                            Lebar roll: {item.roll_width}m
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {item.variant || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {item.stock.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {item.reserved_stock > 0 ? (
                        <span>{item.reserved_stock.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{item.unit}</span></span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {item.available_stock.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {item.min_stock_warning.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {item.is_low_stock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Menipis
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 inline-flex items-center gap-1">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isRollOrArea && onOpenLots && (
                          <button 
                            type="button"
                            onClick={() => onOpenLots(item)}
                            title="Kelola lot roll & offcut"
                            className="px-2.5 py-1 text-[11px] font-semibold skeuo-button text-purple-600 dark:text-purple-400 hover:text-purple-700 inline-flex items-center gap-1 rounded-lg cursor-pointer"
                          >
                            <Layers className="w-3 h-3" /> Roll
                          </button>
                        )}
                        {onOpenUom && (
                          <button 
                            type="button"
                            onClick={() => onOpenUom(item)}
                            title="Konfigurasi konversi satuan (UOM)"
                            className="px-2.5 py-1 text-[11px] font-semibold skeuo-button text-amber-600 dark:text-amber-400 hover:text-amber-700 inline-flex items-center gap-1 rounded-lg cursor-pointer"
                          >
                            <ArrowUpDown className="w-3 h-3" /> UOM
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => onOpenRestock(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold skeuo-button text-blue-600 dark:text-blue-400 hover:text-blue-700 inline-flex items-center gap-1 rounded-lg cursor-pointer"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
