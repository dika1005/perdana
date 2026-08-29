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
  Layers,
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
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<Record<number, boolean>>({});

  const togglePriceEdit = (productId: number) => {
    setEditingPriceIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const toggleMaterialSection = (productId: number) => {
    setExpandedMaterialIds(prev => ({
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
      material_qty: item.product.unit_name?.toLowerCase().includes('rim') ? item.qty : Math.max(1, item.qty),
      material_name: available.name,
      material_unit: available.unit,
      material_stock: available.stock,
    };
    onUpdateMaterials?.(item.product.id, [...currentMaterials, newMaterial]);
    setExpandedMaterialIds(prev => ({ ...prev, [item.product.id]: true }));
  };

  const handleUpdateMaterialId = (item: CartItem, index: number, newMatId: number) => {
    const currentMaterials = [...(item.materials || [])];
    const mat = rawMaterials.find(m => m.id === newMatId);
    if (!mat) return;
    currentMaterials[index] = {
      raw_material_id: newMatId,
      material_qty: currentMaterials[index]?.material_qty || (mat.unit.toLowerCase().includes('rim') ? 1 : item.qty),
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
    <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] flex flex-col skeuo p-4 lg:p-5 shrink-0 h-[calc(100vh-130px)] transition-all">
      {/* Cart Header */}
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
            className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/80 dark:hover:border-rose-900/60 transition-all flex items-center gap-1"
            title="Kosongkan seluruh isi keranjang"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Customer Selector */}
      <div className="my-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shrink-0">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-500" />
          <span>Informasi Pelanggan:</span>
        </label>
        <select 
          value={selectedCustomer ? selectedCustomer.id : ''} 
          onChange={e => {
            const id = Number(e.target.value);
            const found = customers.find(c => c.id === id);
            onSelectCustomer(found || null);
          }}
          className="w-full px-3 py-2 text-xs font-medium text-text-main outline-none bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
        >
          <option value="">👤 Pelanggan Umum (Walk-in)</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} {c.phone ? `• ${c.phone}` : ''}</option>
          ))}
        </select>
        {!selectedCustomer && (
          <input 
            type="text" 
            placeholder="Ketik nama pelanggan / instansi..." 
            value={customCustomerName}
            onChange={e => onCustomCustomerNameChange(e.target.value)}
            className="w-full mt-2 px-3 py-2 text-xs text-text-main outline-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 placeholder:text-slate-400 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all"
          />
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 min-h-[140px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <ShoppingCart className="w-8 h-8 stroke-1" />
            </div>
            <p className="font-bold text-sm text-text-main">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Klik produk pada katalog di sebelah kiri untuk menambahkan ke pesanan.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            // ONLY meteran if unit is meter OR name has banner/spanduk
            const isMeteran = item.product.unit_name?.toLowerCase().includes('meter') || 
              item.product.name.toLowerCase().includes('spanduk') || 
              item.product.name.toLowerCase().includes('banner') ||
              item.product.name.toLowerCase().includes('bendera') ||
              item.product.name.toLowerCase().includes('umbul');

            const isRange = item.product.price_type === 'RANGE';
            const isCustom = item.product.price_type === 'CUSTOM';
            const defaultPrice = Number(item.product.default_price) || 0;
            const isPriceEdited = item.price !== defaultPrice && !isRange;
            const isEditOpen = isRange || (isCustom && !isMeteran) || !!editingPriceIds[item.product.id];

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
            const isMatOpen = expandedMaterialIds[item.product.id] || currentMaterials.length > 0;

            return (
              <div 
                key={item.product.id} 
                className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all overflow-hidden p-3.5 space-y-2.5"
              >
                {/* 1. Item Header: Name, Trash, Price & Subtotal */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-text-main text-xs sm:text-sm leading-snug">
                        {item.product.name}
                      </h4>
                      {item.product.unit_name && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold">
                          /{item.product.unit_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatRupiah(item.price)}
                      </span>
                      {isPriceEdited && (
                        <span className="text-[9px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                          Kustom
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      type="button"
                      onClick={() => onRemoveFromCart(item.product.id)} 
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus produk ini dari keranjang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Price Editor (Inline for Range/Custom, or toggled) */}
                {isEditOpen ? (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-blue-500" />
                        <span>Harga Satuan (Kustom/Nego):</span>
                      </label>
                      {!isRange && !isCustom && (
                        <button
                          type="button"
                          onClick={() => togglePriceEdit(item.product.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                        >
                          Tutup
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-400 text-xs mr-1.5">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={item.price || ''}
                          onChange={e => onUpdatePrice(item.product.id, Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold bg-transparent outline-none text-text-main"
                          placeholder="Masukkan nominal harga..."
                        />
                      </div>
                      {defaultPrice > 0 && item.price !== defaultPrice && !isRange && (
                        <button
                          type="button"
                          onClick={() => onUpdatePrice(item.product.id, defaultPrice)}
                          className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-[10px] font-semibold text-slate-600 rounded-md shrink-0 flex items-center gap-1"
                          title="Reset harga standar"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    {isRange && (
                      <p className={`text-[10px] font-medium ${isOutOfRange ? 'text-rose-500' : 'text-amber-600'}`}>
                        Rentang standar: {formatRupiah(minP)} – {formatRupiah(maxP)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => togglePriceEdit(item.product.id)}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Ubah / Nego Harga</span>
                    </button>
                  </div>
                )}

                {/* 3. Spanduk / Banner Meteran Dimensions (ONLY for genuine meter products) */}
                {isMeteran && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Calculator className="w-3 h-3 text-amber-600" />
                        <span>Ukuran Spanduk:</span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 font-mono bg-amber-100/90 dark:bg-amber-950 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
                        {((item.length || 1) * (item.width || 1)).toFixed(2)} m²
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Panjang (meter)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.length || 1}
                          onChange={e => onUpdateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                          className="w-full px-2 py-1 text-center font-bold font-mono text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-amber-400 text-text-main"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Lebar (meter)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.width || 1}
                          onChange={e => onUpdateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                          className="w-full px-2 py-1 text-center font-bold font-mono text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-amber-400 text-text-main"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Pemakaian Bahan Baku / Kertas (Clean, Optional & Multi-Material) */}
                <div className="pt-1">
                  {currentMaterials.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleAddMaterial(item)}
                      className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors bg-slate-50/50 dark:bg-slate-950/30"
                    >
                      <Package className="w-3 h-3 text-indigo-500" />
                      <span>+ Potong Stok Bahan Baku / Kertas (Opsional)</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Package className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Bahan Baku Terpakai ({currentMaterials.length}):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddMaterial(item)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                          title="Tambah bahan baku tambahan"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Tambah Bahan</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {currentMaterials.map((mat, idx) => {
                          const selectedMat = rawMaterials.find(m => m.id === mat.raw_material_id);
                          return (
                            <div key={`${item.product.id}-mat-${idx}`} className="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-slate-500">Bahan #{idx + 1}</span>
                                <div className="flex items-center gap-1.5">
                                  {selectedMat && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                      selectedMat.stock <= selectedMat.min_stock_warning 
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    }`}>
                                      Sisa: {selectedMat.stock} {selectedMat.unit}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterial(item, idx)}
                                    className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                                    title="Hapus bahan ini"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <select
                                value={mat.raw_material_id}
                                onChange={e => handleUpdateMaterialId(item, idx, Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs text-text-main outline-none bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 font-medium focus:border-indigo-400 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                              >
                                {recommendedMaterials.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} {m.variant ? `• ${m.variant}` : ''} (Sisa: {m.stock} {m.unit})
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center justify-between gap-2 pt-0.5">
                                <div>
                                  <label className="text-[10px] text-slate-500 font-semibold block">
                                    Jumlah Pemakaian:
                                  </label>
                                  {selectedMat?.unit.toLowerCase() === 'rim' && mat.material_qty > 0 && (
                                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                      ≈ {(mat.material_qty / 500).toFixed(2)} Rim
                                    </span>
                                  )}
                                  {selectedMat?.unit.toLowerCase() === 'roll' && mat.material_qty > 0 && (
                                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                      ≈ {(mat.material_qty / 50).toFixed(2)} Roll
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    min="1"
                                    value={mat.material_qty}
                                    onChange={e => handleUpdateMaterialQty(item, idx, Math.max(1, Number(e.target.value)))}
                                    className="w-16 text-center font-extrabold font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-transparent outline-none"
                                    placeholder="Qty"
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {selectedMat?.unit.toLowerCase() === 'rim' ? 'lembar' : (selectedMat?.unit.toLowerCase() === 'roll' ? 'meter' : (selectedMat?.unit || 'pcs'))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Finishing & Add-on Pills */}
                {relevantAddons.length > 0 && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>Finishing Tambahan:</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {relevantAddons.map(addon => {
                        const isSelected = item.addons?.some(a => a.addon.id === addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => onToggleAddon(item.product.id, addon)}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-medium flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            <span>{addon.name}</span>
                            <span className="opacity-80 font-mono">(+{formatRupiah(addon.default_price)})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Quantity Stepper & Subtotal Row */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Total Item:</span>
                    <span className="font-extrabold text-sm text-text-main font-mono">
                      {formatRupiah(itemGrandTotal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    <button 
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, -1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                      title="Kurangi jumlah"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        onUpdateQty(item.product.id, val - item.qty);
                      }}
                      className="w-11 text-center text-xs font-black font-mono text-text-main bg-transparent outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, 1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                      title="Tambah jumlah"
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

      {/* Cart Summary & Checkout Footer */}
      <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 space-y-2 mt-2 shrink-0">
        <div className="space-y-1.5 bg-slate-50/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal ({cart.reduce((sum, item) => sum + item.qty, 0)} pcs):</span>
            <span className="font-bold font-mono text-text-main">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Banknote className="w-3.5 h-3.5 text-blue-500" /> 
              <span>Potongan Diskon:</span>
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 focus-within:border-blue-400">
              <span className="text-[10px] text-slate-400 font-bold">Rp</span>
              <input 
                type="number" 
                min="0"
                value={discountAmount || ''}
                onChange={e => onDiscountChange(Number(e.target.value))}
                placeholder="0"
                className="w-20 text-right outline-none bg-transparent text-xs font-mono font-bold text-text-main"
              />
            </div>
          </div>

          <div className="flex justify-between items-center font-bold text-sm text-text-main pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <span>Total Bayar:</span>
            <span className="text-lg text-blue-600 dark:text-blue-400 font-mono font-extrabold">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        <button 
          type="button"
          disabled={cart.length === 0 || total <= 0}
          onClick={onOpenCheckout}
          className="w-full py-3 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Lanjut ke Pembayaran — {formatRupiah(total)}</span>
        </button>
      </div>
    </div>
  );
};
