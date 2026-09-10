'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { CartItem } from '../types';
import { formatRupiah } from '../../../utils/format';

interface CartItemQtyRowProps {
  item: CartItem;
  grandTotal: number;
  onUpdateQty: (delta: number) => void;
  onSetQty: (qty: number) => void;
}

export const CartItemQtyRow: React.FC<CartItemQtyRowProps> = ({
  item,
  grandTotal,
  onUpdateQty,
  onSetQty,
}) => {
  const minOrder = Number(item.product.min_order) || 0;
  const belowMinOrder = minOrder > 0 && item.qty < minOrder;

  return (
    <div className="flex justify-between items-center pt-2 border-t border-border-main">
      <div>
        <span className="text-[10px] text-slate-400 font-medium block">Total Item:</span>
        <span className="font-extrabold text-sm text-text-main font-mono">
          {formatRupiah(grandTotal)}
        </span>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className={`flex items-center gap-0.5 skeuo-inset rounded-lg p-0.5 ${belowMinOrder ? 'border-rose-400 dark:border-rose-700' : ''}`}>
          <button
            type="button"
            onClick={() => onUpdateQty(-1)}
            aria-label="Kurangi jumlah"
            className="w-7 h-7 flex items-center justify-center rounded-md skeuo-button cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            title="Kurangi jumlah"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min="1"
            aria-label={`Jumlah ${item.product.name}`}
            value={item.qty}
            onChange={e => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              onSetQty(val);
            }}
            className="w-11 text-center text-xs font-black font-mono text-text-main bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 rounded-md tabular-nums"
          />
          <button
            type="button"
            onClick={() => onUpdateQty(1)}
            aria-label="Tambah jumlah"
            className="w-7 h-7 flex items-center justify-center rounded-md skeuo-button cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            title="Tambah jumlah"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {belowMinOrder && (
          <span className="text-[9px] font-bold text-rose-500">
            Min. order {minOrder} {item.product.unit_name || 'pcs'}
          </span>
        )}
      </div>
    </div>
  );
};
