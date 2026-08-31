'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import { formatRupiah } from '../../../utils/format';

interface CartItemHeaderProps {
  item: CartItem;
  isPriceEdited: boolean;
  isOutOfRange: boolean;
  onRemove: () => void;
}

export const CartItemHeader: React.FC<CartItemHeaderProps> = ({
  item,
  isPriceEdited,
  isOutOfRange,
  onRemove,
}) => (
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
        <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
          {formatRupiah(item.price)}
        </span>
        {isPriceEdited && (
          <span className="text-[9px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded font-semibold">
            Kustom
          </span>
        )}
        {isOutOfRange && (
          <span className="text-[9px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 rounded font-bold">
            Di luar rentang
          </span>
        )}
      </div>
    </div>

    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        title="Hapus item ini dari pesanan"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);
