'use client';

import React from 'react';
import { Search, X, Calculator, Sparkles, RefreshCw, FileText, Plus } from 'lucide-react';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { CartItem } from './types';

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
        <div className="flex-1 flex items-center gap-3 px-4 py-3 skeuo-inset rounded-xl bg-white/50 dark:bg-black/20">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input 
            type="text" 
            placeholder="Cari produk... (contoh: Spanduk, Kartu Nama, Undangan, Brosur)" 
            className="bg-transparent border-none outline-none w-full text-sm text-text-main placeholder:text-text-muted/60"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => onSearchTermChange('')} 
              className="text-text-muted hover:text-text-main p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button type="submit" className="px-5 py-3 font-bold skeuo-button text-text-main text-sm shrink-0 rounded-xl">
          Cari
        </button>
      </form>

      {/* Row 2: Tool Buttons — Kalkulator & AI */}
      <div className="flex gap-2 mb-3">
        <button 
          type="button" 
          onClick={onOpenBannerCalc}
          className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 font-bold rounded-xl bg-gradient-to-r from-blue-500/10 to-brand-500/10 border-2 border-blue-400/30 text-brand-700 dark:text-brand-300 text-sm hover:shadow-lg hover:border-blue-400/50 transition-all"
          title="Hitung harga spanduk berdasarkan ukuran meter"
        >
          <Calculator className="w-5 h-5 text-blue-500" />
          <span>🧮 Hitung Harga Spanduk</span>
        </button>

        <button 
          type="button" 
          onClick={onOpenAIModal}
          className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 font-bold rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-2 border-amber-400/30 text-amber-700 dark:text-amber-300 text-sm hover:shadow-lg hover:border-amber-400/50 transition-all"
          title="Tempel chat WhatsApp pesanan, otomatis terisi"
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>📋 Baca Chat WA</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1.5 custom-scrollbar">
        <button 
          onClick={() => onSelectCategory(undefined)}
          className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all ${
            activeCategoryId === undefined 
              ? 'skeuo-inset text-brand-600 bg-brand-50/50' 
              : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          Semua ({products.length})
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 whitespace-nowrap text-xs font-bold rounded-xl transition-all ${
              activeCategoryId === cat.id 
                ? 'skeuo-inset text-brand-600 bg-brand-50/50' 
                : 'skeuo-button text-text-muted hover:text-text-main'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-muted text-sm">
            <RefreshCw className="w-7 h-7 animate-spin mb-3 text-brand-500" />
            <p>Memuat produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-text-muted text-sm skeuo p-8">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-bold">Tidak ada produk ditemukan</p>
            <p className="text-xs mt-1 opacity-70">Coba kata kunci lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(product => {
              const inCartItem = cart.find(c => c.product.id === product.id);
              const isMeteran = product.price_type === 'CUSTOM' || product.unit_name?.toLowerCase().includes('meter');
              const isRange = product.price_type === 'RANGE';

              const priceDisplay = isRange
                ? `Rp ${Number(product.min_price).toLocaleString('id-ID')} - ${Number(product.max_price).toLocaleString('id-ID')}`
                : `Rp ${Number(product.default_price).toLocaleString('id-ID')}`;

              return (
                <div 
                  key={product.id} 
                  onClick={() => onAddToCart(product)}
                  className={`skeuo-button p-4 flex flex-col justify-between text-left group cursor-pointer transition-all relative hover:shadow-lg ${
                    inCartItem ? 'border-brand-500/60 ring-2 ring-brand-500/20' : ''
                  }`}
                >
                  {/* Qty badge di sudut kanan atas */}
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-brand-600 text-white font-bold text-xs shadow-sm">
                      ×{inCartItem.qty}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg skeuo-inset flex items-center justify-center font-bold text-brand-600 text-sm bg-brand-50/50">
                        {product.name.charAt(0)}
                      </div>
                      {isMeteran && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          Meteran
                        </span>
                      )}
                      {isRange && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Harga Rentang
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-text-main line-clamp-2 min-h-[36px] group-hover:text-brand-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-end justify-between">
                    <div>
                      <p className="text-brand-600 font-extrabold text-sm">
                        {priceDisplay}
                      </p>
                      <span className="text-[11px] text-text-muted">
                        / {product.unit_name || 'pcs'}
                        {product.min_order && product.min_order > 1 ? ` (Min. ${product.min_order})` : ''}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-lg skeuo-sm flex items-center justify-center text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
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
