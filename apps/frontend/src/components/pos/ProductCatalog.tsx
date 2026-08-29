'use client';

import React from 'react';
import { Search, X, Calculator, Sparkles, RefreshCw, FileText, Plus, Check } from 'lucide-react';
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
  onSearchSubmit: _onSearchSubmit,
  loading,
  cart,
  onAddToCart,
  onOpenBannerCalc,
  onOpenAIModal,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        {/* Live Search Bar */}
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Ketik nama produk untuk mencari langsung..." 
            className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-text-main placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => onSearchTermChange('')} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Tools: Hitung Spanduk & Baca WA */}
        <div className="flex gap-2 shrink-0">
          <button 
            type="button" 
            onClick={onOpenBannerCalc}
            className="flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 text-xs transition-colors"
            title="Kalkulator khusus spanduk meteran"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Kalkulator Spanduk</span>
          </button>

          <button 
            type="button" 
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-xs transition-colors"
            title="Tempel teks chat WhatsApp pesanan"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Baca WA</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1.5 custom-scrollbar shrink-0">
        <button 
          onClick={() => onSelectCategory(undefined)}
          className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all ${
            activeCategoryId === undefined 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          Semua ({products.length})
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all ${
              activeCategoryId === cat.id 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <p className="font-medium">Memuat katalog produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs skeuo p-8">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-text-main text-sm">Tidak ada produk ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau pilih tab Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {products.map(product => {
              const inCartItem = cart.find(c => c.product.id === product.id);
              const isMeteran = product.unit_name?.toLowerCase().includes('meter') || false;
              const isRange = product.price_type === 'RANGE';
              const isCustom = product.price_type === 'CUSTOM' && !isMeteran;

              const priceDisplay = isRange
                ? `${formatRupiah(product.min_price)} – ${formatRupiah(product.max_price)}`
                : formatRupiah(product.default_price);

              return (
                <div 
                  key={product.id} 
                  onClick={() => onAddToCart(product)}
                  className={`p-3 rounded-xl bg-white dark:bg-slate-900 border transition-all relative cursor-pointer flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-sm select-none ${
                    inCartItem 
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20' 
                      : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Selected count badge */}
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[11px] shadow-xs flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      <span>{inCartItem.qty}</span>
                    </span>
                  )}

                  <div>
                    {/* Badge if special type */}
                    {(isMeteran || isRange || isCustom) && (
                      <div className="mb-1.5 flex items-center gap-1">
                        {isMeteran && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            Meteran
                          </span>
                        )}
                        {isRange && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Rentang
                          </span>
                        )}
                        {isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            Nego / Kustom
                          </span>
                        )}
                      </div>
                    )}

                    <h3 className="font-bold text-xs sm:text-sm text-text-main line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {priceDisplay}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        / {product.unit_name || 'pcs'}
                      </span>
                    </div>

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      inCartItem
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white'
                    }`}>
                      <Plus className="w-4 h-4" />
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
