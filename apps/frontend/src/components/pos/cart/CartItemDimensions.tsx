'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { CartItem } from '../types';

interface CartItemDimensionsProps {
  item: CartItem;
  onUpdateDimensions: (length: number, width: number) => void;
}

export const CartItemDimensions: React.FC<CartItemDimensionsProps> = ({ item, onUpdateDimensions }) => (
  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
        <Calculator className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>Ukuran Spanduk:</span>
      </span>
      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 font-mono bg-amber-100/90 dark:bg-amber-950 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
        {((item.length || 1) * (item.width || 1)).toFixed(2)} m²
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Panjang (meter)</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={item.length || 1}
          onChange={e => onUpdateDimensions(Number(e.target.value), item.width || 1)}
          className="w-full px-2 py-1 text-center font-bold font-mono text-xs skeuo-inset outline-none focus:border-amber-400 text-text-main"
        />
      </div>
      <div>
        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Lebar (meter)</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={item.width || 1}
          onChange={e => onUpdateDimensions(item.length || 1, Number(e.target.value))}
          className="w-full px-2 py-1 text-center font-bold font-mono text-xs skeuo-inset outline-none focus:border-amber-400 text-text-main"
        />
      </div>
    </div>
  </div>
);
