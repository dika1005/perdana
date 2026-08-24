import React from 'react';
import { Printer, RefreshCw, Layers, X } from 'lucide-react';
import { PublicCatalog, PublicProduct } from '../../services/publicService';
import { SortOption, CleanCategory } from '../../hooks/useCatalogFilter';
import { CatalogFilters } from './CatalogFilters';
import { ProductCard } from './ProductCard';

interface CatalogSectionProps {
  catalogRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  error: string | null;
  catalog: PublicCatalog | null;
  processedProducts: PublicProduct[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  activeCategoryId: number | undefined;
  onCategoryChange: (id: number | undefined) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  cleanCategories: CleanCategory[];
  selectedServiceId: string | null;
  onClearServiceFilter: () => void;
  getCategoryName: (id: number | null | undefined) => string | null;
  resetAllFilters: () => void;
  isFilteringActive: boolean;
  onRetry?: () => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = React.memo(({
  catalogRef,
  loading,
  error,
  catalog,
  processedProducts,
  searchTerm,
  onSearchChange,
  activeCategoryId,
  onCategoryChange,
  sortBy,
  onSortChange,
  cleanCategories,
  selectedServiceId,
  onClearServiceFilter,
  getCategoryName,
  resetAllFilters,
  isFilteringActive,
  onRetry
}) => {
  const totalProducts = catalog?.products.length || 0;
  const storeName = catalog?.store.name;
  const storePhone = catalog?.store.phone;

  return (
    <section ref={catalogRef} className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-18 scroll-mt-20">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 mb-2">
            <Printer className="w-3.5 h-3.5" />
            <span>Daftar Produk & Harga</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Katalog Produk Percetakan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Gunakan pencarian, sortir urutan, atau filter kategori untuk mencari item
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFilteringActive && (
            <button 
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
          <div className="glass-card px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">{processedProducts.length}</span> / {totalProducts} Produk
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <CatalogFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        activeCategoryId={activeCategoryId}
        onCategoryChange={onCategoryChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        cleanCategories={cleanCategories}
        totalProducts={totalProducts}
        selectedServiceId={selectedServiceId}
        onClearServiceFilter={onClearServiceFilter}
      />

      {/* Product Cards Grid & Loading/Error States */}
      {loading ? (
        <div className="glass-card p-12 rounded-3xl text-center max-w-md mx-auto my-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Memuat Katalog Produk...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 rounded-3xl max-w-md mx-auto text-center my-8">
          <Printer className="w-12 h-12 mx-auto mb-3 text-rose-500 opacity-80" />
          <p className="font-extrabold text-base text-slate-900 dark:text-white mb-1">Gagal Memuat Katalog</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button 
            onClick={onRetry || (() => window.location.reload())} 
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : processedProducts.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl max-w-lg mx-auto text-center my-8">
          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-60" />
          <p className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mb-1">Produk Tidak Ditemukan</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Tidak ada produk yang cocok dengan kata kunci atau filter yang Anda pilih.
          </p>
          <button 
            onClick={resetAllFilters}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-7">
          {processedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={getCategoryName(product.category_id)}
              storeName={storeName}
              storePhone={storePhone}
            />
          ))}
        </div>
      )}
    </section>
  );
});

CatalogSection.displayName = 'CatalogSection';
