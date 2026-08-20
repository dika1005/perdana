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
          <ShoppingCart className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-text-main">Keranjang Kasir</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full text-xs font-bold skeuo-inset">
            {cart.length} Produk
          </span>
          {cart.length > 0 && (
            <button 
              type="button"
              onClick={onClearCart} 
              className="text-[11px] text-red-500 hover:text-red-700 font-medium ml-1"
              title="Kosongkan keranjang"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector Box */}
      <div className="my-3 p-3 rounded-xl skeuo-inset bg-white/40 dark:bg-black/20 text-xs">
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5 flex items-center gap-1">
          <User className="w-3 h-3 text-brand-500" /> Data Pemesan:
        </label>
        <select 
          value={selectedCustomer ? selectedCustomer.id : ''} 
          onChange={e => {
            const id = Number(e.target.value);
            const found = customers.find(c => c.id === id);
            onSelectCustomer(found || null);
          }}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-text-main outline-none bg-transparent rounded-lg border border-black/10 dark:border-white/10"
        >
          <option value="">Pelanggan Umum (Ketik Bebas)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
          ))}
        </select>
        {!selectedCustomer && (
          <input 
            type="text" 
            placeholder="Nama Pembeli (opsional, default: Umum)..." 
            value={customCustomerName}
            onChange={e => onCustomCustomerNameChange(e.target.value)}
            className="w-full mt-2 px-2.5 py-1.5 text-xs text-text-main outline-none rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
          />
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 min-h-[160px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60 text-xs py-10">
            <ShoppingCart className="w-10 h-10 mb-2 stroke-1" />
            <p className="font-semibold">Keranjang masih kosong</p>
            <p className="text-[11px]">Klik produk dari katalog atau gunakan AI Smart Order.</p>
          </div>
        ) : (
          cart.map((item) => {
            const isCustom = item.product.price_type === 'CUSTOM' || 
              item.product.unit_name?.toLowerCase().includes('meter') || 
              item.product.name.toLowerCase().includes('banner') || 
              item.product.name.toLowerCase().includes('spanduk');

            return (
              <div key={item.product.id} className="skeuo-inset p-3 rounded-xl flex flex-col gap-2 text-xs bg-white/30 dark:bg-black/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-text-main text-xs">{item.product.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-text-muted">Harga Satuan:</span>
                      <span className="font-mono font-semibold text-text-muted">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveFromCart(item.product.id)} 
                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Hapus item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Kalkulator Meteran Spanduk / Banner (Jika produk custom) */}
                {isCustom && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-1 text-[11px] text-text-main">
                    <div className="flex items-center gap-1">
                      <Calculator className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="font-semibold text-amber-700 dark:text-amber-300">P×L (m):</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.length || 1}
                        onChange={e => onUpdateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                        className="w-11 px-1 py-0.5 text-center font-bold outline-none rounded bg-white dark:bg-black/40 border border-black/10 text-xs"
                        title="Panjang (meter)"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.width || 1}
                        onChange={e => onUpdateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                        className="w-11 px-1 py-0.5 text-center font-bold outline-none rounded bg-white dark:bg-black/40 border border-black/10 text-xs"
                        title="Lebar (meter)"
                      />
                      <span className="font-bold text-amber-700 dark:text-amber-300 ml-1">
                        = {((item.length || 1) * (item.width || 1)).toFixed(1)} m²
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtotal & Quantity Controls */}
                <div className="flex justify-between items-center pt-1.5 border-t border-black/5 dark:border-white/5">
                  <span className="font-bold text-brand-600 text-xs">
                    Subtotal: Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                  
                  <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/40 rounded-lg p-0.5 border border-black/10">
                    <button 
                      onClick={() => onUpdateQty(item.product.id, -1)} 
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 text-text-main font-bold"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold font-mono">{item.qty}</span>
                    <button 
                      onClick={() => onUpdateQty(item.product.id, 1)} 
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 text-text-main font-bold"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Button */}
      <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2 mt-2">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal:</span>
            <span className="font-semibold font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between items-center text-text-muted">
            <span className="flex items-center gap-1">
              <Banknote className="w-3 h-3 text-brand-500" /> Diskon (Rp):
            </span>
            <input 
              type="number"
              min="0"
              value={discountAmount || ''}
              onChange={e => onDiscountChange(Number(e.target.value))}
              placeholder="0"
              className="w-24 text-right px-2 py-0.5 rounded border border-black/10 dark:border-white/10 bg-transparent text-xs font-mono font-semibold"
            />
          </div>

          <div className="flex justify-between font-black text-sm text-text-main pt-1.5 border-t border-black/5 dark:border-white/5">
            <span>Total Tagihan:</span>
            <span className="text-base text-brand-600 font-mono">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button 
          type="button"
          disabled={cart.length === 0}
          onClick={onOpenCheckout}
          className="w-full py-3 mt-1 font-bold skeuo-button-primary bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Proses Pembayaran (Rp {total.toLocaleString('id-ID')})</span>
        </button>
      </div>
    </div>
  );
};
