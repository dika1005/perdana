'use client';

import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { ProductAddon } from '../../../types/product';
import { CartItem } from '../types';
import { formatRupiah } from '../../../utils/format';

interface CartItemAddonsProps {
  item: CartItem;
  addons: ProductAddon[];
  onToggleAddon: (addon: ProductAddon) => void;
  onUpdateAddonQty?: (addonId: number, qty: number) => void;
}

export const CartItemAddons: React.FC<CartItemAddonsProps> = ({
  item,
  addons,
  onToggleAddon,
  onUpdateAddonQty,
}) => {
  if (addons.length === 0) return null;

  return (
    <div className="pt-1 border-t border-border-main space-y-1.5">
      <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-brand-500" />
        <span>Finishing Tambahan:</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {addons.map(addon => {
          const selectedAddon = item.addons?.find(a => a.addon.id === addon.id);
          const isSelected = !!selectedAddon;
          const addonQty = selectedAddon?.qty || 1;
          const addonSubtotal = (Number(addon.default_price) || 0) * addonQty;

          return (
            <div
              key={addon.id}
              className={`flex items-center rounded-lg border transition-all ${
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-400 dark:border-brand-700 text-brand-900 dark:text-brand-200 shadow-2xs'
                  : 'skeuo-button text-slate-600 dark:text-slate-400'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleAddon(addon)}
                className="px-2 py-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isSelected && <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" />}
                <span>{addon.name}</span>
                <span className="opacity-80 font-mono text-[10px]">
                  {isSelected && addonQty > 1 ? `(${addonQty}x = ${formatRupiah(addonSubtotal)})` : `(+${formatRupiah(addon.default_price)})`}
                </span>
              </button>

              {isSelected && (
                <div className="flex items-center border-l border-brand-300 dark:border-brand-800 pl-1 pr-1.5 py-0.5 gap-1 bg-white/80 dark:bg-slate-900/80 rounded-r-lg">
                  <button
                    type="button"
                    onClick={e => {
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
                    onChange={e => {
                      e.stopPropagation();
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      onUpdateAddonQty?.(addon.id, val);
                    }}
                    className="w-7 text-center font-mono font-black text-xs bg-transparent outline-none text-brand-700 dark:text-brand-300"
                  />
                  <button
                    type="button"
                    onClick={e => {
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
  );
};
