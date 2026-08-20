'use client';

import React from 'react';
import { ShoppingCart, User, Trash2, Calculator, Minus, Plus, Banknote, CreditCard } from 'lucide-react';
import { Customer } from '../../types/customer';
import { CartItem } from './types';

interface CartSidebarProps {
  cart: CartItem[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  customCustomerName: string;
  onCustomCustomerNameChange: (val: string) => void;
  onUpdateQty: (id: number, delta: number) => void;
  onUpdatePrice: (id: number, price: number) => void;
  onUpdateDimensions: (id: number, length: number, width: number) => void;
  onRemoveFromCart: (id: number) => void;
  onClearCart: () => void;
  discountAmount: number;
  onDiscountChange: (val: number) => void;
  subtotal: number;
  total: number;
  onOpenCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  customers,
  selectedCustomer,
  onSelectCustomer,
  customCustomerName,
  onCustomCustomerNameChange,
  onUpdateQty,
  onUpdatePrice,
  onUpdateDimensions,
  onRemoveFromCart,
  onClearCart,
  discountAmount,
  onDiscountChange,
  subtotal,
  total,
  onOpenCheckout,
}) => {
  return (
    <div className="w-full lg:w-[420px] flex flex-col skeuo p-4 shrink-0 h-[calc(100vh-140px)] bg-bg-skeuo">
      {/* Cart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-bold text-text-main">Keranjang</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-full text-xs font-bold skeuo-inset">
            {cart.length} Item
          </span>
          {cart.length > 0 && (
            <button 
              type="button"
              onClick={onClearCart} 
              className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Kosongkan keranjang"
            >
              Kosongkan
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector Box */}
      <div className="my-3 p-3 rounded-xl skeuo-inset bg-white/40 dark:bg-black/20">
        <label className="block text-xs font-bold text-text-muted mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-brand-500" /> Nama Pemesan:
        </label>
        <select 
          value={selectedCustomer ? selectedCustomer.id : ''} 
          onChange={e => {
            const id = Number(e.target.value);
            const found = customers.find(c => c.id === id);
            onSelectCustomer(found || null);
          }}
          className="w-full px-3 py-2 text-sm font-medium text-text-main outline-none bg-transparent rounded-lg border border-black/10 dark:border-white/10"
        >
          <option value="">Pelanggan Umum (Ketik Manual)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
          ))}
        </select>
        {!selectedCustomer && (
          <input 
            type="text" 
            placeholder="Ketik nama pembeli..." 
            value={customCustomerName}
            onChange={e => onCustomCustomerNameChange(e.target.value)}
            className="w-full mt-2 px-3 py-2 text-sm text-text-main outline-none rounded-lg border border-black/10 dark:border-white/10 bg-transparent placeholder:text-text-muted/60"
          />
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 min-h-[160px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60 py-10">
            <ShoppingCart className="w-12 h-12 mb-3 stroke-1" />
            <p className="font-bold text-sm">Keranjang kosong</p>
            <p className="text-xs mt-1">Klik produk dari katalog untuk menambahkan.</p>
          </div>
        ) : (
          cart.map((item) => {
            const isCustom = item.product.price_type === 'CUSTOM' || 
              item.product.unit_name?.toLowerCase().includes('meter') || 
              item.product.name.toLowerCase().includes('banner') || 
              item.product.name.toLowerCase().includes('spanduk');

            return (
              <div key={item.product.id} className="skeuo-inset p-3.5 rounded-xl flex flex-col gap-2.5 bg-white/30 dark:bg-black/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-text-main text-sm">{item.product.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-text-muted">Harga:</span>
                      <span className="font-mono font-bold text-xs text-text-main">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveFromCart(item.product.id)} 
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Hapus item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Dimensi Meteran (Spanduk / Banner) */}
                {isCustom && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calculator className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold text-xs text-amber-700 dark:text-amber-300">Ukuran (meter):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-text-muted font-semibold block mb-0.5">Panjang</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.length || 1}
                          onChange={e => onUpdateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                          className="w-full px-2 py-1.5 text-center font-bold outline-none rounded-lg bg-white dark:bg-black/40 border border-black/10 text-sm"
                        />
                      </div>
                      <span className="text-lg font-bold text-text-muted mt-4">×</span>
                      <div className="flex-1">
                        <label className="text-[10px] text-text-muted font-semibold block mb-0.5">Lebar</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.width || 1}
                          onChange={e => onUpdateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-center font-bold outline-none rounded-lg bg-white dark:bg-black/40 border border-black/10 text-sm"
                        />
                      </div>
                      <div className="mt-4 shrink-0">
                        <span className="font-bold text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg">
                          = {((item.length || 1) * (item.width || 1)).toFixed(1)} m²
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtotal & Quantity Controls */}
                <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="font-bold text-brand-600 text-sm">
                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                  
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-black/40 rounded-lg p-0.5 border border-black/10">
                    <button 
                      onClick={() => onUpdateQty(item.product.id, -1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-text-main font-bold transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono">{item.qty}</span>
                    <button 
                      onClick={() => onUpdateQty(item.product.id, 1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-text-main font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Button */}
      <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2.5 mt-2">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-text-muted text-xs">
            <span>Subtotal:</span>
            <span className="font-bold font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5 text-text-muted">
              <Banknote className="w-3.5 h-3.5 text-brand-500" /> Potongan Harga:
            </span>
            <input 
              type="number"
              min="0"
              value={discountAmount || ''}
              onChange={e => onDiscountChange(Number(e.target.value))}
              placeholder="0"
              className="w-28 text-right px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm font-mono font-bold"
            />
          </div>

          <div className="flex justify-between font-black text-base text-text-main pt-2 border-t border-black/5 dark:border-white/5">
            <span>Total:</span>
            <span className="text-lg text-brand-600 font-mono">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button 
          type="button"
          disabled={cart.length === 0}
          onClick={onOpenCheckout}
          className="w-full py-3.5 mt-1 font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-brand-500 hover:from-emerald-600 hover:to-brand-600 text-white text-sm flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          <CreditCard className="w-5 h-5" />
          <span>Proses Pembayaran — Rp {total.toLocaleString('id-ID')}</span>
        </button>
      </div>
    </div>
  );
};
