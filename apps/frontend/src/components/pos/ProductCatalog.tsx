'use client';

import React from 'react';
import { Search, X, Calculator, Sparkles, RefreshCw, FileText, Plus, Check } from 'lucide-react';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { CartItem } from './types';
import { formatRupiah } from '../../utils/format';
import { EmptyState } from '../shared';

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
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl skeuo-sm focus-within:border-brand-500 transition-all">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Ketik nama produk untuk mencari langsung..."
            className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-text-main placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSearchSubmit(e); } }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchTermChange('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60 text-xs transition-colors cursor-pointer"
            title="Kalkulator khusus spanduk meteran"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Kalkulator Spanduk</span>
          </button>

          <button
            type="button"
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-xs transition-colors cursor-pointer"
            title="Tempel teks chat WhatsApp pesanan"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Baca WA</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1.5 custom-scrollbar shrink-0">
        <button
          onClick={() => onSelectCategory(undefined)}
          className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeCategoryId === undefined
              ? 'bg-brand-600 text-white shadow-xs'
              : 'skeuo-button text-slate-600 dark:text-slate-400'
          }`}
        >
          Semua ({products.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeCategoryId === cat.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'skeuo-button text-slate-600 dark:text-slate-400'
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
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-brand-500" />
            <p className="font-medium">Memuat katalog produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="skeuo">
            <EmptyState
              icon={<FileText className="w-8 h-8" />}
              title="Tidak ada produk ditemukan"
              description="Coba kata kunci lain atau pilih tab Semua."
            />
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
                  className={`p-3 rounded-xl skeuo-sm transition-all relative cursor-pointer flex flex-col justify-between hover:border-brand-400 dark:hover:border-brand-600 select-none ${
                    inCartItem
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20'
                      : ''
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-brand-600 text-white font-black text-[11px] shadow-xs flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      <span>{inCartItem.qty}</span>
                    </span>
                  )}

                  <div>
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

                  <div className="mt-2.5 pt-2 border-t border-border-main flex items-end justify-between">
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm text-brand-600 dark:text-brand-400 font-mono">
                        {priceDisplay}
                      </p>
                      <span className="text-[10px] text-text-muted font-medium">
                        / {product.unit_name || 'pcs'}
                      </span>
                    </div>

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      inCartItem
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-600 hover:text-white'
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
