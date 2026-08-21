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
    <div className="w-full lg:w-[420px] flex flex-col skeuo p-4 shrink-0 h-[calc(100vh-140px)]">
      {/* Cart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-bold text-text-main">Keranjang Belanja</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            {cart.length} Item
          </span>
          {cart.length > 0 && (
            <button 
              type="button"
              onClick={onClearCart} 
              className="text-[11px] text-rose-500 hover:text-rose-700 font-medium px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Kosongkan keranjang"
            >
              Kosongkan
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector Box */}
      <div className="my-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-500" /> Nama Pemesan:
        </label>
        <select 
          value={selectedCustomer ? selectedCustomer.id : ''} 
          onChange={e => {
            const id = Number(e.target.value);
            const found = customers.find(c => c.id === id);
            onSelectCustomer(found || null);
          }}
          className="w-full px-3 py-1.5 text-xs font-medium text-text-main outline-none bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
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
            className="w-full mt-2 px-3 py-1.5 text-xs text-text-main outline-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 placeholder:text-slate-400 font-medium"
          />
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 min-h-[160px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
            <ShoppingCart className="w-10 h-10 mb-2 stroke-1 opacity-50" />
            <p className="font-semibold text-xs text-text-main">Keranjang kosong</p>
            <p className="text-[11px] mt-0.5">Klik produk dari katalog untuk menambahkan.</p>
          </div>
        ) : (
          cart.map((item) => {
            const isMeteran = item.product.price_type === 'CUSTOM' || 
              item.product.unit_name?.toLowerCase().includes('meter') || 
              item.product.name.toLowerCase().includes('banner') || 
              item.product.name.toLowerCase().includes('spanduk');

            const isRange = item.product.price_type === 'RANGE';
            const isCustom = item.product.price_type === 'CUSTOM';
            const minOrder = Number(item.product.min_order) || 1;

            return (
              <div key={item.product.id} className="p-3 rounded-xl flex flex-col gap-2 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-text-main text-xs">{item.product.name}</h4>
                      {minOrder > 1 && (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-semibold px-1.5 py-0.5 rounded">
                          Min. {minOrder} {item.product.unit_name}
                        </span>
                      )}
                    </div>

                    {/* Harga Satuan */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Harga:</span>
                      {isRange || (isCustom && !isMeteran) ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="font-semibold text-slate-400 text-[10px]">Rp</span>
                          <input
                            type="number"
                            min="1"
                            value={item.price || ''}
                            onChange={e => onUpdatePrice(item.product.id, Number(e.target.value))}
                            className="w-20 text-xs font-mono font-bold bg-transparent outline-none text-text-main"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-text-main">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                      )}

                      {isRange && (
                        <span className="text-[10px] text-slate-400">
                          ({Number(item.product.min_price).toLocaleString('id-ID')} - {Number(item.product.max_price).toLocaleString('id-ID')})
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onRemoveFromCart(item.product.id)} 
                    className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                    title="Hapus item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dimensi Meteran */}
                {isMeteran && (
                  <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Calculator className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-semibold text-[11px] text-amber-700 dark:text-amber-300">Ukuran Spanduk (meter):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-medium block">Panjang</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.length || 1}
                          onChange={e => onUpdateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                          className="w-full px-2 py-1 text-center font-bold outline-none rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-text-main"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-400 mt-3">×</span>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-medium block">Lebar</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.width || 1}
                          onChange={e => onUpdateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                          className="w-full px-2 py-1 text-center font-bold outline-none rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-text-main"
                        />
                      </div>
                      <div className="mt-3 shrink-0">
                        <span className="font-semibold text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                          = {((item.length || 1) * (item.width || 1)).toFixed(1)} m²
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtotal & Quantity Controls */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span className="font-bold text-text-main text-xs font-mono">
                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                  
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => onUpdateQty(item.product.id, -1)} 
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-main transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-text-main">{item.qty}</span>
                    <button 
                      onClick={() => onUpdateQty(item.product.id, 1)} 
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-main transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Button */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 mt-2">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal:</span>
            <span className="font-semibold font-mono text-text-main">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Banknote className="w-3.5 h-3.5 text-blue-500" /> Diskon:
            </span>
            <input 
              type="number"
              min="0"
              value={discountAmount || ''}
              onChange={e => onDiscountChange(Number(e.target.value))}
              placeholder="0"
              className="w-24 text-right px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-text-main"
            />
          </div>

          <div className="flex justify-between font-bold text-sm text-text-main pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
            <span>Total:</span>
            <span className="text-base text-blue-600 dark:text-blue-400 font-mono">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <button 
          type="button"
          disabled={cart.length === 0 || total <= 0}
          onClick={onOpenCheckout}
          className="w-full py-2.5 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Proses Bayar — Rp {total.toLocaleString('id-ID')}</span>
        </button>
      </div>
    </div>
  );
};
