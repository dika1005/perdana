'use client';

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  User, 
  Trash2, 
  Calculator, 
  Minus, 
  Plus, 
  Banknote, 
  CreditCard, 
  Sparkles, 
  Check, 
  Edit3, 
  RefreshCw, 
  Tag, 
  AlertCircle,
  X,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Customer } from '../../types/customer';
import { ProductAddon } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItem, CartItemMaterial } from './types';
import { formatRupiah } from '../../utils/format';

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
  onUpdateMaterials?: (productId: number, materials: CartItemMaterial[]) => void;
  onToggleAddon: (productId: number, addon: ProductAddon) => void;
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
  
  // Default: kertas & amplop/plastik (no banner-specific items)
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
  onUpdateMaterials,
  onToggleAddon,
  onRemoveFromCart,
  onClearCart,
  discountAmount,
  onDiscountChange,
  subtotal,
  total,
  onOpenCheckout,
}) => {
  const [editingPriceIds, setEditingPriceIds] = useState<Record<number, boolean>>({});
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  const togglePriceEdit = (productId: number) => {
    setEditingPriceIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const toggleExpanded = (productId: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleAddMaterial = (item: CartItem) => {
    const currentMaterials = item.materials || [];
    const recommendedMaterials = getRecommendedMaterials(item, rawMaterials);
    // Find first material not already selected
    const available = recommendedMaterials.find(m => !currentMaterials.some(cm => cm.raw_material_id === m.id));
    if (!available) return;
    
    const newMaterial: CartItemMaterial = {
      raw_material_id: available.id,
      material_qty: item.qty,
      material_name: available.name,
      material_unit: available.unit,
      material_stock: available.stock,
    };
    onUpdateMaterials?.(item.product.id, [...currentMaterials, newMaterial]);
  };

  const handleUpdateMaterialId = (item: CartItem, index: number, newMatId: number) => {
    const currentMaterials = [...(item.materials || [])];
    const mat = rawMaterials.find(m => m.id === newMatId);
    if (!mat) return;
    currentMaterials[index] = {
      raw_material_id: newMatId,
      material_qty: currentMaterials[index]?.material_qty || item.qty,
      material_name: mat.name,
      material_unit: mat.unit,
      material_stock: mat.stock,
    };
    onUpdateMaterials?.(item.product.id, currentMaterials);
  };

  const handleUpdateMaterialQty = (item: CartItem, index: number, qty: number) => {
    const currentMaterials = [...(item.materials || [])];
    if (currentMaterials[index]) {
      currentMaterials[index] = { ...currentMaterials[index], material_qty: Math.max(1, qty) };
    }
    onUpdateMaterials?.(item.product.id, currentMaterials);
  };

  const handleRemoveMaterial = (item: CartItem, index: number) => {
    const currentMaterials = [...(item.materials || [])];
    currentMaterials.splice(index, 1);
    onUpdateMaterials?.(item.product.id, currentMaterials);
  };

  return (
    <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] flex flex-col skeuo p-5 lg:p-6 shrink-0 h-[calc(100vh-130px)] transition-all">
      {/* Cart Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-main">Keranjang</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {cart.length === 0 ? 'Belum ada item' : `${cart.length} jenis produk`}
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <button 
            type="button"
            onClick={onClearCart} 
            className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/80 dark:hover:border-rose-900/60 transition-all flex items-center gap-1.5"
            title="Kosongkan seluruh isi keranjang"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Customer Selector */}
      <div className="my-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          <span>Pelanggan</span>
        </label>
        <select 
          value={selectedCustomer ? selectedCustomer.id : ''} 
          onChange={e => {
            const id = Number(e.target.value);
            const found = customers.find(c => c.id === id);
            onSelectCustomer(found || null);
          }}
          className="w-full px-3 py-2.5 text-sm font-medium text-text-main outline-none bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
        >
          <option value="">👤 Pelanggan Umum (Walk-in)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `• ${c.phone}` : ''}</option>
          ))}
        </select>
        {!selectedCustomer && (
          <input 
            type="text" 
            placeholder="Ketik nama pembeli / instansi..." 
            value={customCustomerName}
            onChange={e => onCustomCustomerNameChange(e.target.value)}
            className="w-full mt-2.5 px-3 py-2.5 text-sm text-text-main outline-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 placeholder:text-slate-400 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all"
          />
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 min-h-[160px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 text-slate-400">
              <ShoppingCart className="w-10 h-10 stroke-1" />
            </div>
            <p className="font-bold text-base text-text-main">Keranjang Kosong</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
              Pilih produk dari katalog di sebelah kiri untuk mulai membuat pesanan.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const isMeteran = item.product.price_type === 'CUSTOM' || 
              item.product.unit_name?.toLowerCase().includes('meter') || 
              item.product.name.toLowerCase().includes('banner') || 
              item.product.name.toLowerCase().includes('spanduk');

            const isRange = item.product.price_type === 'RANGE';
            const isCustom = item.product.price_type === 'CUSTOM';
            const defaultPrice = Number(item.product.default_price) || 0;
            const isPriceEdited = item.price !== defaultPrice && !isRange;
            const isEditOpen = isRange || (isCustom && !isMeteran) || !!editingPriceIds[item.product.id];
            const isExpanded = expandedIds[item.product.id] !== false; // default expanded

            const minP = Number(item.product.min_price) || 0;
            const maxP = Number(item.product.max_price) || 0;
            const isOutOfRange = isRange && (item.price < minP || (maxP > 0 && item.price > maxP));

            const relevantAddons = availableAddons.filter(a => 
              a.category_id === null || 
              a.category_id === undefined || 
              a.category_id === item.product.category_id
            );

            const itemBaseTotal = item.price * item.qty;
            const itemAddonsTotal = (item.addons || []).reduce((sum, a) => sum + (a.price * a.qty), 0);
            const itemGrandTotal = itemBaseTotal + itemAddonsTotal;

            const recommendedMaterials = getRecommendedMaterials(item, rawMaterials);
            const currentMaterials = item.materials || [];

            return (
              <div 
                key={item.product.id} 
                className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-blue-300/60 dark:hover:border-blue-700/40 shadow-sm transition-all overflow-hidden"
              >
                {/* Item Header - Always Visible */}
                <div className="flex justify-between items-center p-4 pb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-main text-sm leading-snug truncate pr-2">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {item.product.unit_name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                          /{item.product.unit_name}
                        </span>
                      )}
                      <span className="text-xs font-semibold font-mono text-blue-600 dark:text-blue-400">
                        @ {formatRupiah(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.product.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      title={isExpanded ? 'Tutup detail' : 'Buka detail'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button 
                      type="button"
                      onClick={() => onRemoveFromCart(item.product.id)} 
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quantity & Subtotal Bar - Always Visible */}
                <div className="flex justify-between items-center px-4 py-3 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/60">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Subtotal</span>
                    <span className="font-extrabold text-text-main text-base font-mono">
                      {formatRupiah(itemGrandTotal)}
                    </span>
                    {(item.addons?.length || 0) > 0 && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">
                        +{item.addons?.length} finishing
                      </span>
                    )}
                  </div>
                  
                  {/* Qty Controls */}
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button 
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, -1)} 
                      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-text-main transition-colors"
                      title="Kurangi jumlah"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-extrabold font-mono text-text-main">
                      {item.qty}
                    </span>
                    <button 
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, 1)} 
                      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-text-main transition-colors"
                      title="Tambah jumlah"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable Detail Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/60 p-4 space-y-4">

                    {/* Price Editor */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Harga Satuan
                          </span>
                        </div>

                        {!isRange && !isCustom && (
                          <button
                            type="button"
                            onClick={() => togglePriceEdit(item.product.id)}
                            className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                              isEditOpen 
                                ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            }`}
                            title="Ubah harga satuan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditOpen ? 'Tutup' : 'Ubah Harga'}</span>
                          </button>
                        )}
                      </div>

                      {isEditOpen ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-blue-300 dark:border-blue-700/80 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950">
                              <span className="font-bold text-slate-500 dark:text-slate-400 text-sm mr-2">Rp</span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={item.price || ''}
                                onChange={e => onUpdatePrice(item.product.id, Number(e.target.value))}
                                className="w-full text-base font-mono font-bold bg-transparent outline-none text-text-main"
                                placeholder="Masukkan harga..."
                              />
                            </div>

                            {defaultPrice > 0 && item.price !== defaultPrice && !isRange && (
                              <button
                                type="button"
                                onClick={() => onUpdatePrice(item.product.id, defaultPrice)}
                                className="p-2.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title={`Reset ke ${formatRupiah(defaultPrice)}`}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {isRange ? (
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${
                              isOutOfRange 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : 'text-amber-700 dark:text-amber-400'
                            }`}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Rentang: <strong>{formatRupiah(minP)}</strong> – <strong>{formatRupiah(maxP)}</strong>
                              </span>
                            </div>
                          ) : defaultPrice > 0 && item.price !== defaultPrice ? (
                            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                              <span>Standar: {formatRupiah(defaultPrice)}</span>
                              <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md font-bold text-[11px]">Kustom</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-base text-text-main">
                            {formatRupiah(item.price)}
                          </span>
                          {isPriceEdited && (
                            <span className="text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-semibold px-2 py-0.5 rounded-md">
                              Kustom
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dimensi Meteran (Spanduk / Banner) */}
                    {isMeteran && (
                      <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                              Dimensi Spanduk
                            </span>
                          </div>
                          <span className="font-bold text-sm text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                            {((item.length || 1) * (item.width || 1)).toFixed(2)} m²
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                              Panjang (meter)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={item.length || 1}
                              onChange={e => onUpdateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                              className="w-full px-3 py-2.5 text-center font-bold font-mono outline-none rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-text-main focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                              Lebar (meter)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={item.width || 1}
                              onChange={e => onUpdateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                              className="w-full px-3 py-2.5 text-center font-bold font-mono outline-none rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-text-main focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* === PEMAKAIAN BAHAN BAKU (MULTI MATERIAL) === */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                            Pemakaian Bahan Baku
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMaterial(item)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                          title="Tambah bahan baku yang digunakan"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Bahan</span>
                        </button>
                      </div>

                      {currentMaterials.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
                          Belum ada bahan baku dipilih. Klik "Tambah Bahan" untuk memilih.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {currentMaterials.map((mat, idx) => {
                            const selectedMat = rawMaterials.find(m => m.id === mat.raw_material_id);
                            return (
                              <div key={`${item.product.id}-mat-${idx}`} className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Bahan #{idx + 1}</span>
                                  <div className="flex items-center gap-2">
                                    {selectedMat && (
                                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-bold ${
                                        selectedMat.stock <= selectedMat.min_stock_warning 
                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                      }`}>
                                        Stok: {selectedMat.stock} {selectedMat.unit}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMaterial(item, idx)}
                                      className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                      title="Hapus bahan ini"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <select
                                  value={mat.raw_material_id}
                                  onChange={e => handleUpdateMaterialId(item, idx, Number(e.target.value))}
                                  className="w-full px-3 py-2 text-sm text-text-main outline-none bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer font-medium focus:border-indigo-400 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                                >
                                  {recommendedMaterials.map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} {m.variant ? `• ${m.variant}` : ''} (Sisa: {m.stock} {m.unit})
                                    </option>
                                  ))}
                                </select>

                                <div className="flex items-center justify-between gap-3">
                                  <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                    Jumlah Pemakaian:
                                  </label>
                                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <input
                                      type="number"
                                      min="1"
                                      value={mat.material_qty}
                                      onChange={e => handleUpdateMaterialQty(item, idx, Number(e.target.value))}
                                      className="w-20 text-center font-extrabold font-mono text-sm text-indigo-600 dark:text-indigo-400 bg-transparent outline-none"
                                      placeholder="Qty"
                                    />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                      {selectedMat?.unit || mat.material_unit || 'lembar'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Finishing & Add-ons */}
                    {relevantAddons.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span>Opsi Finishing / Tambahan</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {relevantAddons.map(addon => {
                            const isSelected = item.addons?.some(a => a.addon.id === addon.id);
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={() => onToggleAddon(item.product.id, addon)}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center gap-2 transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                )}
                                <span>{addon.name}</span>
                                <span className={isSelected ? 'text-blue-100 font-bold' : 'text-blue-600 dark:text-blue-400 font-bold font-mono'}>
                                  (+{formatRupiah(addon.default_price)})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="pt-4 border-t border-slate-200/90 dark:border-slate-800 space-y-3 mt-3">
        <div className="space-y-2 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Subtotal ({cart.reduce((sum, item) => sum + item.qty, 0)} pcs):</span>
            <span className="font-bold font-mono text-text-main">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Banknote className="w-4 h-4 text-blue-500" /> 
              <span>Diskon:</span>
            </span>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus-within:border-blue-400">
              <span className="text-xs text-slate-400 font-bold">Rp</span>
              <input 
                type="number" 
                min="0"
                value={discountAmount || ''}
                onChange={e => onDiscountChange(Number(e.target.value))}
                placeholder="0"
                className="w-28 text-right outline-none bg-transparent text-sm font-mono font-bold text-text-main"
              />
            </div>
          </div>

          <div className="flex justify-between items-center font-bold text-base text-text-main pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
            <span>Total Bayar:</span>
            <span className="text-xl text-blue-600 dark:text-blue-400 font-mono font-extrabold">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        <button 
          type="button"
          disabled={cart.length === 0 || total <= 0}
          onClick={onOpenCheckout}
          className="w-full py-3.5 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-base flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
        >
          <CreditCard className="w-5 h-5" />
          <span>Lanjut ke Pembayaran — {formatRupiah(total)}</span>
        </button>
      </div>
    </div>
  );
};
