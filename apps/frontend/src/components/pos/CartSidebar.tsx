'use client';

import React, { useState } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Customer } from '../../types/customer';
import { ProductAddon } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItem } from './types';
import { CartCustomerSelector } from './CartCustomerSelector';
import { CartItemCard } from './CartItemCard';
import { CartFooterSummary } from './CartFooterSummary';

interface CartSidebarProps {
  cart: CartItem[];
  customers: Customer[];
  availableAddons: ProductAddon[];
  rawMaterials?: RawMaterial[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  customCustomerName: string;
  onCustomCustomerNameChange: (val: string) => void;
  onUpdateQty: (id: number, delta: number) => void;
  onUpdatePrice: (id: number, price: number) => void;
  onUpdateDimensions: (id: number, length: number, width: number) => void;
  onToggleAddon: (productId: number, addon: ProductAddon) => void;
  onUpdateAddonQty?: (productId: number, addonId: number, qty: number) => void;
  onRemoveFromCart: (id: number) => void;
  onClearCart: () => void;
  discountAmount: number;
  onDiscountChange: (val: number) => void;
  subtotal: number;
  total: number;
  onOpenCheckout: () => void;
}

const getRecommendedMaterials = (item: CartItem, allMaterials: RawMaterial[]) => {
  const prodName = item.product.name.toLowerCase();
  const unitName = (item.product.unit_name || '').toLowerCase();
  
  const isBanner = prodName.includes('banner') || prodName.includes('spanduk') || prodName.includes('baliho') || prodName.includes('umbul') || prodName.includes('bendera') || unitName.includes('meter');
  const isStiker = prodName.includes('stiker') || prodName.includes('label');
  const isStempel = prodName.includes('stempel') || prodName.includes('id card') || prodName.includes('lanyard') || prodName.includes('pin') || prodName.includes('gantungan');
  
  if (isBanner) {
    const list = allMaterials.filter(m => {
      const name = m.name.toLowerCase();
      return name.includes('banner') || name.includes('flexi') || name.includes('spanduk') || name.includes('kain tc') || name.includes('stand') || name.includes('roll') || name.includes('tinta');
    });
    return list.length > 0 ? list : allMaterials;
  }
  
  if (isStiker) {
    const list = allMaterials.filter(m => {
      const name = m.name.toLowerCase();
      return name.includes('stiker') || name.includes('cromo') || name.includes('vinyl') || name.includes('kunsruk') || name.includes('art paper');
    });
    return list.length > 0 ? list : allMaterials;
  }
  
  if (isStempel) {
    const list = allMaterials.filter(m => {
      const name = m.name.toLowerCase();
      return name.includes('stempel') || name.includes('karet') || name.includes('flash') || name.includes('lanyard') || name.includes('case');
    });
    return list.length > 0 ? list : allMaterials;
  }
  
  const list = allMaterials.filter(m => {
    const name = m.name.toLowerCase();
    const isBannerSpecific = (name.includes('flexi') || name.includes('stand x') || name.includes('stand y') || name.includes('roll banner') || name.includes('spanduk kain'));
    return !isBannerSpecific;
  });
  return list.length > 0 ? list : allMaterials;
};

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  customers,
  availableAddons,
  rawMaterials = [],
  selectedCustomer,
  onSelectCustomer,
  customCustomerName,
  onCustomCustomerNameChange,
  onUpdateQty,
  onUpdatePrice,
  onUpdateDimensions,
  onToggleAddon,
  onUpdateAddonQty,
  onRemoveFromCart,
  onClearCart,
  discountAmount,
  onDiscountChange,
  subtotal,
  total,
  onOpenCheckout,
}) => {
  const [editingPriceIds, setEditingPriceIds] = useState<Record<number, boolean>>({});

  const togglePriceEdit = (productId: number) => {
    setEditingPriceIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };



  return (
    <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] flex flex-col skeuo p-4 lg:p-5 shrink-0 h-[calc(100vh-130px)] transition-all">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-main">Keranjang Pesanan</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {cart.length === 0 ? 'Belum ada produk' : `${cart.length} item dalam pesanan`}
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <button 
            type="button"
            onClick={onClearCart} 
            className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/80 dark:hover:border-rose-900/60 transition-all flex items-center gap-1 cursor-pointer"
            title="Kosongkan seluruh isi keranjang"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* 2. Customer Selector */}
      <CartCustomerSelector
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={onSelectCustomer}
        customCustomerName={customCustomerName}
        onCustomCustomerNameChange={onCustomCustomerNameChange}
      />

      {/* 3. Items List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-3">
              <ShoppingCart className="w-7 h-7 stroke-1 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-text-main">Keranjang Masih Kosong</p>
            <p className="text-xs max-w-[240px] mt-1 text-slate-500 dark:text-slate-400">
              Klik produk pada katalog di sebelah kiri untuk menambahkan pesanan.
            </p>
          </div>
        ) : (
          cart.map(item => {
            const isRange = item.product.price_type === 'RANGE';
            const isCustom = item.product.price_type === 'CUSTOM';
            const isPriceEdited = item.price !== (Number(item.product.default_price) || 0);
            const isEditOpen = editingPriceIds[item.product.id] || isRange || isCustom;

            return (
              <CartItemCard
                key={item.product.id}
                item={item}
                rawMaterials={rawMaterials}
                availableAddons={availableAddons}
                isPriceEdited={isPriceEdited}
                isEditOpen={isEditOpen}
                recommendedMaterials={[]}
                onTogglePriceEdit={() => togglePriceEdit(item.product.id)}
                onUpdateQty={(delta) => onUpdateQty(item.product.id, delta)}
                onSetQty={(qty) => onUpdateQty(item.product.id, qty - item.qty)}
                onUpdatePrice={(price) => onUpdatePrice(item.product.id, price)}
                onUpdateDimensions={(l, w) => onUpdateDimensions(item.product.id, l, w)}
                onToggleAddon={(addon) => onToggleAddon(item.product.id, addon)}
                onUpdateAddonQty={(addonId, qty) => onUpdateAddonQty?.(item.product.id, addonId, qty)}
                onRemove={() => onRemoveFromCart(item.product.id)}
              />
            );
          })
        )}
      </div>

      {/* 4. Footer Summary & Checkout */}
      <CartFooterSummary
        cartLength={cart.length}
        subtotal={subtotal}
        total={total}
        discountAmount={discountAmount}
        onDiscountChange={onDiscountChange}
        onOpenCheckout={onOpenCheckout}
      />
    </div>
  );
};
