'use client';

import React from 'react';
import { Search, X, Calculator, Sparkles, RefreshCw, FileText, Plus } from 'lucide-react';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { CartItem } from './types';
import { formatRupiah } from '../../utils/format';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  activeCategoryId?: number;
  onSelectCategory: (id?: number) => void;
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onOpenBannerCalc: () => void;
  onOpenAIModal: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  activeCategoryId,
  onSelectCategory,
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  loading,
  cart,
  onAddToCart,
  onOpenBannerCalc,
  onOpenAIModal,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Row 1: Search Bar */}
      <form onSubmit={onSearchSubmit} className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Cari produk... (contoh: Spanduk, Kartu Nama, Undangan, Brosur)" 
            className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => onSearchTermChange('')} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button type="submit" className="px-4 py-2.5 font-semibold skeuo-button text-text-main text-xs shrink-0 rounded-xl">
          Cari
        </button>
      </form>

      {/* Row 2: Tool Buttons — Kalkulator & AI */}
      <div className="flex gap-2 mb-3">
        <button 
          type="button" 
          onClick={onOpenBannerCalc}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 font-semibold rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 text-xs transition-colors"
          title="Hitung harga spanduk berdasarkan ukuran meter"
        >
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Hitung Harga Spanduk</span>
        </button>

        <button 
          type="button" 
          onClick={onOpenAIModal}
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 font-semibold rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 border border-purple-200/80 dark:border-purple-800/60 text-xs transition-colors"
          title="Tempel chat WhatsApp pesanan, otomatis terisi"
        >
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Baca Chat WA</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1.5 custom-scrollbar">
        <button 
          onClick={() => onSelectCategory(undefined)}
          className={`px-3 py-1.5 whitespace-nowrap text-xs rounded-xl transition-all ${
            activeCategoryId === undefined 
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
          }`}
        >
          Semua ({products.length})
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 whitespace-nowrap text-xs rounded-xl transition-all ${
              activeCategoryId === cat.id 
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <p className="font-medium">Memuat produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs skeuo p-8">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-text-main">Tidak ada produk ditemukan</p>
            <p className="text-[11px] mt-0.5 opacity-70">Coba kata kunci lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(product => {
              const inCartItem = cart.find(c => c.product.id === product.id);
              const isMeteran = product.unit_name?.toLowerCase().includes('meter') || false;
              const isRange = product.price_type === 'RANGE';
              const isCustom = product.price_type === 'CUSTOM' && !isMeteran;

              const priceDisplay = isRange
                ? `${formatRupiah(product.min_price)} - ${formatRupiah(product.max_price)}`
                : formatRupiah(product.default_price);

              return (
                <div 
                  key={product.id} 
                  onClick={() => onAddToCart(product)}
                  className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border transition-all relative cursor-pointer flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 shadow-sm ${
                    inCartItem 
                      ? 'border-blue-500 ring-2 ring-blue-500/20' 
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Qty badge */}
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] shadow-sm">
                      ×{inCartItem.qty}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60">
                        {product.name.charAt(0)}
                      </div>
                      {isMeteran && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60">
                          Meteran
                        </span>
                      )}
                      {isRange && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
                          Rentang
                        </span>
                      )}
                      {isCustom && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60">
                          Custom
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-xs text-text-main line-clamp-2 min-h-[32px]">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
                    <div>
                      <p className="font-bold text-xs text-text-main font-mono">
                        {priceDisplay}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        / {product.unit_name || 'pcs'}
                        {product.min_order && product.min_order > 1 ? ` (Min. ${product.min_order})` : ''}
                      </span>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
