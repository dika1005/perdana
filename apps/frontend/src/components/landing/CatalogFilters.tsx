import React from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { SortOption, CleanCategory } from '../../hooks/useCatalogFilter';

interface CatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  activeCategoryId: number | undefined;
  onCategoryChange: (id: number | undefined) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  cleanCategories: CleanCategory[];
  totalProducts: number;
  selectedServiceId: string | null;
  onClearServiceFilter: () => void;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = React.memo(({
  searchTerm,
  onSearchChange,
  activeCategoryId,
  onCategoryChange,
  sortBy,
  onSortChange,
  cleanCategories,
  totalProducts,
  selectedServiceId,
  onClearServiceFilter
}) => {
  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Search Input */}
        <div className="md:col-span-6 flex items-center gap-3 px-4 py-3 glass-card rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Cari nama produk (contoh: Spanduk, Stiker, Kartu Nama, Brosur)..." 
            className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => onSearchChange('')} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              title="Hapus Pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-3 flex items-center gap-2 px-3.5 py-3 glass-card rounded-2xl">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <select
            value={activeCategoryId === undefined ? '' : activeCategoryId}
            onChange={(e) => {
              const val = e.target.value;
              onCategoryChange(val === '' ? undefined : Number(val));
              onClearServiceFilter();
            }}
            className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              Semua Kategori ({totalProducts})
            </option>
            {cleanCategories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="md:col-span-3 flex items-center gap-2 px-3.5 py-3 glass-card rounded-2xl">
          <ArrowUpDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="default" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Urutkan: Default</option>
            <option value="price_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Harga: Termurah → Termahal</option>
            <option value="price_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Harga: Termahal → Termurah</option>
            <option value="name_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nama: A → Z</option>
            <option value="name_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nama: Z → A</option>
            <option value="custom_size" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tipe: Ukuran Meteran (P×L)</option>
          </select>
        </div>

      </div>

      {/* Quick Category Filter Pills */}
      {cleanCategories.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
          <button 
            onClick={() => {
              onCategoryChange(undefined);
              onClearServiceFilter();
            }}
            className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
              activeCategoryId === undefined && !selectedServiceId
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                : 'glass-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({totalProducts})
          </button>
          {cleanCategories.map((cat) => {
            const isCatActive = activeCategoryId === cat.id;
            return (
              <button 
                key={cat.id}
                onClick={() => {
                  onCategoryChange(cat.id);
                  onClearServiceFilter();
                }}
                className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                  isCatActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                    : 'glass-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

CatalogFilters.displayName = 'CatalogFilters';
