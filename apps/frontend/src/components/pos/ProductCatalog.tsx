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
      {/* Top Bar: Search, Banner Calculator, & AI Smart Order */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={onSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl bg-white/50 dark:bg-black/20">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input 
              type="text" 
              placeholder="Ketik nama produk cetak (contoh: Spanduk, Kartu Nama, Brosur)..." 
              className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
              value={searchTerm}
              onChange={e => onSearchTermChange(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => onSearchTermChange('')} 
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button type="submit" className="px-5 py-2.5 font-bold skeuo-button text-text-main text-xs shrink-0">
            Cari
          </button>
        </form>

        {/* Banner Calculator Trigger Button */}
        <button 
          type="button" 
          onClick={onOpenBannerCalc}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 font-bold rounded-xl bg-gradient-to-r from-blue-500/15 via-brand-500/15 to-emerald-500/15 border border-blue-500/30 text-brand-600 dark:text-brand-300 text-xs hover:shadow-md transition-all shrink-0"
          title="Hitung harga spanduk / banner meteran (P x L x Tarif per m2)"
        >
          <Calculator className="w-4 h-4 text-brand-500" />
          <span>📐 Kalkulator Banner (m²)</span>
        </button>

        {/* AI Smart Order Trigger Button */}
        <button 
          type="button" 
          onClick={onOpenAIModal}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 font-bold rounded-xl bg-gradient-to-r from-amber-500/15 via-brand-500/15 to-purple-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs hover:shadow-md transition-all shrink-0"
          title="Paste teks WhatsApp pesanan dan biarkan AI mengisi otomatis"
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>✨ AI Smart Order</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1.5 custom-scrollbar">
        <button 
          onClick={() => onSelectCategory(undefined)}
          className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all ${
            activeCategoryId === undefined 
              ? 'skeuo-inset text-brand-600 font-bold bg-brand-50/50' 
              : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          Semua Kategori ({products.length})
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all ${
              activeCategoryId === cat.id 
                ? 'skeuo-inset text-brand-600 font-bold bg-brand-50/50' 
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
          <div className="flex flex-col items-center justify-center h-64 text-text-muted text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-brand-500" />
            <p>Memuat katalog produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-text-muted text-xs skeuo p-8">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold">Tidak ada produk ditemukan</p>
            <p className="text-[11px] mt-1">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(product => {
              const inCartItem = cart.find(c => c.product.id === product.id);
              const isCustom = product.price_type === 'CUSTOM' || product.unit_name?.toLowerCase().includes('meter');

              return (
                <div 
                  key={product.id} 
                  onClick={() => onAddToCart(product)}
                  className={`skeuo-button p-3.5 flex flex-col justify-between text-left group cursor-pointer transition-all relative ${
                    inCartItem ? 'border-brand-500/60 ring-2 ring-brand-500/20' : ''
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-brand-600 text-white font-bold text-[10px] shadow-sm">
                      ×{inCartItem.qty}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg skeuo-inset flex items-center justify-center font-bold text-brand-600 text-xs bg-brand-50/50">
                        {product.name.charAt(0)}
                      </div>
                      {isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          Ukuran P×L
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-xs text-text-main line-clamp-2 min-h-[32px] group-hover:text-brand-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-end justify-between">
                    <div>
                      <p className="text-brand-600 font-extrabold text-xs">
                        Rp {Number(product.default_price).toLocaleString('id-ID')}
                      </p>
                      <span className="text-[10px] text-text-muted">/ {product.unit_name || 'pcs'}</span>
                    </div>
                    <div className="w-6 h-6 rounded-lg skeuo-sm flex items-center justify-center text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
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
