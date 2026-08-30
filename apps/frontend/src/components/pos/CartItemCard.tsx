'use client';

import React from 'react';
import { 
  Trash2, 
  Calculator, 
  Minus, 
  Plus, 
  Sparkles, 
  Check, 
  Edit3, 
  RefreshCw, 
  Tag, 
  Package,
} from 'lucide-react';
import { ProductAddon } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItem } from './types';
import { formatRupiah } from '../../utils/format';

interface CartItemCardProps {
  item: CartItem;
  rawMaterials: RawMaterial[];
  availableAddons: ProductAddon[];
  isPriceEdited: boolean;
  isEditOpen: boolean;
  isMatOpen?: boolean;
  recommendedMaterials: RawMaterial[];
  onTogglePriceEdit: () => void;
  onToggleMaterialSection?: () => void;
  onUpdateQty: (delta: number) => void;
  onSetQty: (qty: number) => void;
  onUpdatePrice: (price: number) => void;
  onUpdateDimensions: (length: number, width: number) => void;
  onToggleAddon: (addon: ProductAddon) => void;
  onUpdateAddonQty?: (addonId: number, qty: number) => void;
  onRemove: () => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  rawMaterials: _rawMaterials,
  availableAddons,
  isPriceEdited,
  isEditOpen,
  isMatOpen: _isMatOpen,
  recommendedMaterials: _recommendedMaterials,
  onTogglePriceEdit,
  onToggleMaterialSection: _onToggleMaterialSection,
  onUpdateQty,
  onSetQty,
  onUpdatePrice,
  onUpdateDimensions,
  onToggleAddon,
  onUpdateAddonQty,
  onRemove,
}) => {
  const isRange = item.product.price_type === 'RANGE';
  const isCustom = item.product.price_type === 'CUSTOM';
  const minP = Number(item.product.min_price) || 0;
  const maxP = Number(item.product.max_price) || 0;
  const defaultPrice = Number(item.product.default_price) || 0;
  const isOutOfRange = isRange && ((minP > 0 && item.price < minP) || (maxP > 0 && item.price > maxP));

  const prodUnit = (item.product.unit_name || '').toLowerCase();
  const prodNameLower = (item.product.name || '').toLowerCase();
  const isMeteran = prodUnit.includes('meter') || prodNameLower.includes('/meter') || (item.length && item.width && (item.length > 1 || item.width > 1));

  const relevantAddons = availableAddons.filter(a => 
    a.category_id === null || 
    a.category_id === undefined || 
    a.category_id === item.product.category_id
  );

  const itemBaseTotal = item.price * item.qty;
  const itemAddonsTotal = (item.addons || []).reduce((sum, a) => sum + ((Number(a.price) || 0) * (Number(a.qty) || 1)), 0);
  const itemGrandTotal = itemBaseTotal + itemAddonsTotal;

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all overflow-hidden p-3.5 space-y-2.5">
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
            onClick={onRemove} 
            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Hapus item ini dari pesanan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Price Editor */}
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
                onClick={onTogglePriceEdit}
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
                onChange={e => onUpdatePrice(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold bg-transparent outline-none text-text-main"
                placeholder="Masukkan nominal harga..."
              />
            </div>
            {defaultPrice > 0 && item.price !== defaultPrice && !isRange && (
              <button
                type="button"
                onClick={() => onUpdatePrice(defaultPrice)}
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
            onClick={onTogglePriceEdit}
            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>Ubah / Nego Harga</span>
          </button>
        </div>
      )}

      {/* 3. Spanduk / Banner Meteran Dimensions */}
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
                onChange={e => onUpdateDimensions(Number(e.target.value), item.width || 1)}
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
                onChange={e => onUpdateDimensions(item.length || 1, Number(e.target.value))}
                className="w-full px-2 py-1 text-center font-bold font-mono text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-amber-400 text-text-main"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Bahan diputuskan oleh BOM terverifikasi di server, bukan kasir. */}
      <div className="flex items-start gap-2 rounded-lg border border-indigo-200/70 bg-indigo-50/50 p-2.5 text-[11px] text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-200">
        <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <p>
          Kebutuhan bahan, allowance waste, dan bahan finishing dihitung dari BOM master saat pesanan dibuat. Stok akan dikunci ketika DP/pelunasan diterima dan dipotong saat pekerjaan masuk proses.
        </p>
      </div>

      {/* 5. Finishing & Add-on Pills */}
      {relevantAddons.length > 0 && (
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Finishing Tambahan:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {relevantAddons.map(addon => {
              const selectedAddon = item.addons?.find(a => a.addon.id === addon.id);
              const isSelected = !!selectedAddon;
              const addonQty = selectedAddon?.qty || 1;
              const addonSubtotal = (Number(addon.default_price) || 0) * addonQty;

              return (
                <div
                  key={addon.id}
                  className={`flex items-center rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleAddon(addon)}
                    className="px-2 py-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    <span>{addon.name}</span>
                    <span className="opacity-80 font-mono text-[10px]">
                      {isSelected && addonQty > 1 ? `(${addonQty}x = ${formatRupiah(addonSubtotal)})` : `(+${formatRupiah(addon.default_price)})`}
                    </span>
                  </button>

                  {isSelected && (
                    <div className="flex items-center border-l border-blue-300 dark:border-blue-800 pl-1 pr-1.5 py-0.5 gap-1 bg-white/80 dark:bg-slate-900/80 rounded-r-lg">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAddonQty?.(addon.id, Math.max(1, addonQty - 1));
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[11px] font-black leading-none cursor-pointer"
                        title="Kurangi jumlah finishing"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={addonQty}
                        onChange={(e) => {
                          e.stopPropagation();
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          onUpdateAddonQty?.(addon.id, val);
                        }}
                        className="w-7 text-center font-mono font-black text-xs bg-transparent outline-none text-blue-700 dark:text-blue-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAddonQty?.(addon.id, addonQty + 1);
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[11px] font-black leading-none cursor-pointer"
                        title="Tambah jumlah finishing"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
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
            onClick={() => onUpdateQty(-1)} 
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
              onSetQty(val);
            }}
            className="w-11 text-center text-xs font-black font-mono text-text-main bg-transparent outline-none"
          />
          <button 
            type="button"
            onClick={() => onUpdateQty(1)} 
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title="Tambah jumlah"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
