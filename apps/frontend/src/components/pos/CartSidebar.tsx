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
  X
} from 'lucide-react';
import { Customer } from '../../types/customer';
import { ProductAddon } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItem } from './types';
import { formatRupiah } from '../../utils/format';
import { Package, Layers } from 'lucide-react';

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
  onUpdateRawMaterial?: (productId: number, rawMaterialId?: number, materialQty?: number) => void;
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
  
  // Default for Undangan, Brosur, Nota, Faktur, Buku, Yasin, Kalender, Map, dll.
  // Hanya menampilkan kertas & amplop/plastik, tidak memunculkan banner roll/stand
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
  onUpdateRawMaterial,
  onToggleAddon,
  onRemoveFromCart,
  onClearCart,
  discountAmount,
  onDiscountChange,
  subtotal,
  total,
  onOpenCheckout,
}) => {
  // Track which items have price edit mode toggled open manually
  const [editingPriceIds, setEditingPriceIds] = useState<Record<number, boolean>>({});

  const togglePriceEdit = (productId: number) => {
    setEditingPriceIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <div className="w-full lg:w-[460px] xl:w-[500px] 2xl:w-[540px] flex flex-col skeuo p-4 lg:p-5 shrink-0 h-[calc(100vh-130px)] transition-all">
      {/* Cart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-main">Keranjang Belanja</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {cart.length === 0 ? 'Belum ada item dipilih' : `${cart.length} jenis item dalam keranjang`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button 
              type="button"
              onClick={onClearCart} 
              className="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/80 dark:hover:border-rose-900/60 transition-all flex items-center gap-1"
              title="Kosongkan seluruh isi keranjang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector Box */}
      <div className="my-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
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
          <option value="">👤 Pelanggan Umum (Ketik Manual / Walk-in)</option>
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
            className="w-full mt-2 px-3 py-2 text-xs text-text-main outline-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 placeholder:text-slate-400 font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all"
          />
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 space-y-3 min-h-[180px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <ShoppingCart className="w-8 h-8 stroke-1" />
            </div>
            <p className="font-bold text-sm text-text-main">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
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
            const minOrder = Number(item.product.min_order) || 1;
            const defaultPrice = Number(item.product.default_price) || 0;
            const isPriceEdited = item.price !== defaultPrice && !isRange;
            
            // Auto open edit for range/custom or if explicitly toggled
            const isEditOpen = isRange || (isCustom && !isMeteran) || !!editingPriceIds[item.product.id];

            // Range warnings
            const minP = Number(item.product.min_price) || 0;
            const maxP = Number(item.product.max_price) || 0;
            const isOutOfRange = isRange && (item.price < minP || (maxP > 0 && item.price > maxP));

            // Relevant add-ons for this product
            const relevantAddons = availableAddons.filter(a => 
              a.category_id === null || 
              a.category_id === undefined || 
              a.category_id === item.product.category_id
            );

            const itemBaseTotal = item.price * item.qty;
            const itemAddonsTotal = (item.addons || []).reduce((sum, a) => sum + (a.price * a.qty), 0);
            const itemGrandTotal = itemBaseTotal + itemAddonsTotal;

            return (
              <div 
                key={item.product.id} 
                className="p-3.5 rounded-xl flex flex-col gap-2.5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all"
              >
                {/* Item Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h4 className="font-bold text-text-main text-xs sm:text-sm leading-snug">
                        {item.product.name}
                      </h4>
                      {minOrder > 1 && (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-bold px-1.5 py-0.5 rounded">
                          Min. {minOrder} {item.product.unit_name}
                        </span>
                      )}
                      {item.product.unit_name && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded font-medium">
                          /{item.product.unit_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => onRemoveFromCart(item.product.id)} 
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                    title="Hapus item dari keranjang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Custom Price & Price Editor Section */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Harga Satuan:
                      </span>
                    </div>

                    {!isRange && !isCustom && (
                      <button
                        type="button"
                        onClick={() => togglePriceEdit(item.product.id)}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                          isEditOpen 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                        }`}
                        title="Sesuaikan harga satuan untuk pesanan ini"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditOpen ? 'Tutup Edit' : 'Ubah / Custom'}</span>
                      </button>
                    )}
                  </div>

                  {/* Price Display or Direct Input */}
                  {isEditOpen ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700/80 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950">
                          <span className="font-bold text-slate-500 dark:text-slate-400 text-xs mr-1.5">Rp</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={item.price || ''}
                            onChange={e => onUpdatePrice(item.product.id, Number(e.target.value))}
                            className="w-full text-sm font-mono font-bold bg-transparent outline-none text-text-main"
                            placeholder="Masukkan harga custom..."
                          />
                        </div>

                        {defaultPrice > 0 && item.price !== defaultPrice && !isRange && (
                          <button
                            type="button"
                            onClick={() => onUpdatePrice(item.product.id, defaultPrice)}
                            className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                            title={`Kembalikan ke harga default (${formatRupiah(defaultPrice)})`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Reset</span>
                          </button>
                        )}
                      </div>

                      {/* Helper Range / Default Info */}
                      {isRange ? (
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${
                          isOutOfRange 
                            ? 'text-rose-600 dark:text-rose-400' 
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>
                            Rentang resmi: <strong>{formatRupiah(minP)}</strong> – <strong>{formatRupiah(maxP)}</strong>
                          </span>
                        </div>
                      ) : defaultPrice > 0 && item.price !== defaultPrice ? (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          <span>Harga standar: {formatRupiah(defaultPrice)}</span>
                          <span className="bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded font-bold">Kustom Aktif</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-text-main">
                        {formatRupiah(item.price)}
                      </span>
                      {isPriceEdited && (
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-semibold px-1.5 py-0.5 rounded">
                          Harga Kustom
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Dimensi Meteran (Spanduk / Banner) */}
                {isMeteran && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                          Dimensi Spanduk:
                        </span>
                      </div>
                      <span className="font-bold text-xs text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md">
                        {((item.length || 1) * (item.width || 1)).toFixed(2)} m²
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">
                          Panjang (meter)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.length || 1}
                          onChange={e => onUpdateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                          className="w-full px-2.5 py-1.5 text-center font-bold font-mono outline-none rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-text-main focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">
                          Lebar (meter)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.width || 1}
                          onChange={e => onUpdateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-center font-bold font-mono outline-none rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-text-main focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pemakaian Bahan Baku & Kertas (Rekomendasi Cerdas) */}
                {(() => {
                  const recommendedMaterials = getRecommendedMaterials(item, rawMaterials);
                  const selectedMat = rawMaterials.find(m => m.id === item.raw_material_id);

                  return (
                    <div className="p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                            Bahan Baku / Kertas yang Dipakai:
                          </span>
                        </div>
                        {selectedMat && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            selectedMat.stock <= selectedMat.min_stock_warning 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            Stok Gudang: {selectedMat.stock} {selectedMat.unit}
                          </span>
                        )}
                      </div>

                      <select
                        value={item.raw_material_id || ''}
                        onChange={e => {
                          const matId = e.target.value ? Number(e.target.value) : undefined;
                          const defaultQty = matId ? (item.material_qty || item.qty) : undefined;
                          onUpdateRawMaterial?.(item.product.id, matId, defaultQty);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs text-text-main outline-none bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer font-medium focus:border-indigo-400 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                      >
                        <option value="">🚫 Tanpa Potong Bahan Baku</option>
                        {recommendedMaterials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.variant ? `• ${m.variant}` : ''} (Sisa: {m.stock} {m.unit})
                          </option>
                        ))}
                      </select>

                      {item.raw_material_id && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                          <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                            Jumlah Lembar / Pemakaian Fisik:
                          </label>
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                            <input
                              type="number"
                              min="1"
                              value={item.material_qty !== undefined ? item.material_qty : item.qty}
                              onChange={e => onUpdateRawMaterial?.(item.product.id, item.raw_material_id, Math.max(1, Number(e.target.value)))}
                              className="w-16 text-center font-extrabold font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-transparent outline-none"
                              placeholder="Qty"
                            />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {selectedMat?.unit || 'lembar'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Finishing & Add-on Relevan */}
                {relevantAddons.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Opsi Tambahan / Finishing:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {relevantAddons.map(addon => {
                        const isSelected = item.addons?.some(a => a.addon.id === addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => onToggleAddon(item.product.id, addon)}
                            className={`px-2.5 py-1 text-[11px] rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                                : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3 h-3 shrink-0 text-white" />
                            ) : (
                              <Plus className="w-3 h-3 shrink-0 text-slate-400" />
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

                {/* Subtotal & Quantity Stepper Footer */}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      Subtotal Item:
                    </span>
                    <span className="font-extrabold text-text-main text-sm font-mono">
                      {formatRupiah(itemGrandTotal)}
                    </span>
                    {(item.addons?.length || 0) > 0 && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">
                        Termasuk {item.addons?.length} finishing
                      </span>
                    )}
                  </div>
                  
                  {/* Qty Controls */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <button 
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, -1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-text-main transition-colors"
                      title="Kurangi jumlah"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-extrabold font-mono text-text-main">
                      {item.qty}
                    </span>
                    <button 
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, 1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-text-main transition-colors"
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
      <div className="pt-3.5 border-t border-slate-200/90 dark:border-slate-800 space-y-2.5 mt-2">
        <div className="space-y-1.5 text-xs bg-slate-50/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal ({cart.reduce((sum, item) => sum + item.qty, 0)} pcs):</span>
            <span className="font-bold font-mono text-text-main">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Banknote className="w-3.5 h-3.5 text-blue-500" /> 
              <span>Potongan Diskon:</span>
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 focus-within:border-blue-400">
              <span className="text-[10px] text-slate-400 font-bold">Rp</span>
              <input 
                type="number" 
                min="0"
                value={discountAmount || ''}
                onChange={e => onDiscountChange(Number(e.target.value))}
                placeholder="0"
                className="w-24 text-right outline-none bg-transparent text-xs font-mono font-bold text-text-main"
              />
            </div>
          </div>

          <div className="flex justify-between items-center font-bold text-sm text-text-main pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <span>Total Pembayaran:</span>
            <span className="text-lg text-blue-600 dark:text-blue-400 font-mono font-extrabold">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        <button 
          type="button"
          disabled={cart.length === 0 || total <= 0}
          onClick={onOpenCheckout}
          className="w-full py-3 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Lanjut ke Pembayaran — {formatRupiah(total)}</span>
        </button>
      </div>
    </div>
  );
};
