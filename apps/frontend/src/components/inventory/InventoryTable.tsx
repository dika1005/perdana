'use client';

import React from 'react';
import { Search, Package, AlertTriangle, ArrowUpRight } from 'lucide-react';
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
}) => {
  return (
    <div className="skeuo p-6">
      <form onSubmit={onSearchSubmit} className="flex gap-4 mb-6">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 skeuo-inset rounded-xl">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input 
            type="text" 
            placeholder="Cari nama bahan baku..." 
            className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70 text-sm"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory || ''} 
          onChange={e => onSelectCategory(e.target.value ? Number(e.target.value) : undefined)}
          className="px-4 py-3 skeuo font-medium text-text-main outline-none bg-transparent rounded-xl text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="px-6 py-3 font-bold skeuo-button text-text-main text-sm rounded-xl">
          Cari
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
              <th className="pb-4">Nama Bahan</th>
              <th className="pb-4">Varian</th>
              <th className="pb-4">Stok Saat Ini</th>
              <th className="pb-4">Batas Minimum</th>
              <th className="pb-4">Status</th>
              <th className="pb-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                  Memuat data dari database...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                  Belum ada data bahan baku di database.
                </td>
              </tr>
            ) : (
              materials.map(item => (
                <tr key={item.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                  <td className="py-4 font-bold text-text-main flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg skeuo-inset flex items-center justify-center text-text-muted">
                      <Package className="w-5 h-5" />
                    </div>
                    {item.name}
                  </td>
                  <td className="py-4 text-text-muted">
                    {item.variant || '-'}
                  </td>
                  <td className="py-4">
                    <span className="font-bold text-lg text-text-main">{item.stock}</span> <span className="text-text-muted">{item.unit}</span>
                  </td>
                  <td className="py-4 text-text-muted">
                    {item.min_stock_warning} {item.unit}
                  </td>
                  <td className="py-4">
                    {item.is_low_stock ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-red-500 bg-red-50 flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" /> Menipis
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-emerald-500 bg-emerald-50">
                        Aman
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => onOpenRestock(item)}
                      className="px-4 py-2 text-xs font-bold skeuo-button text-brand-600 flex items-center gap-2 ml-auto rounded-lg"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Mutasi IN
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
