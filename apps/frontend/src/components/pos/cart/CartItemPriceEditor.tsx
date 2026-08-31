'use client';

import React from 'react';
import { Edit3, RefreshCw, Tag } from 'lucide-react';
import { CartItem } from '../types';
import { formatRupiah } from '../../../utils/format';

interface CartItemPriceEditorProps {
  item: CartItem;
  isEditOpen: boolean;
  refPrice: number;
  isOutOfRange: boolean;
  onTogglePriceEdit: () => void;
  onUpdatePrice: (price: number) => void;
}

export const CartItemPriceEditor: React.FC<CartItemPriceEditorProps> = ({
  item,
  isEditOpen,
  refPrice,
  isOutOfRange,
  onTogglePriceEdit,
  onUpdatePrice,
}) => {
  const isRange = item.product.price_type === 'RANGE';
  const isCustom = item.product.price_type === 'CUSTOM';
  const minP = Number(item.product.min_price) || 0;
  const maxP = Number(item.product.max_price) || 0;

  if (!isEditOpen) {
    return (
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onTogglePriceEdit}
          className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Edit3 className="w-2.5 h-2.5" />
          <span>Ubah / Nego Harga</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 rounded-lg skeuo-inset space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
          <Tag className="w-3 h-3 text-brand-500" />
          <span>Harga Satuan (Kustom/Nego):</span>
        </label>
        {!isRange && !isCustom && (
          <button
            type="button"
            onClick={onTogglePriceEdit}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
          >
            Tutup
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex-1 flex items-center skeuo-inset px-2.5 py-1.5 ${isOutOfRange ? 'border-rose-400 dark:border-rose-700' : ''}`}>
          <span className="font-bold text-slate-400 text-xs mr-1.5">Rp</span>
          <input
            type="number"
            min="0"
            step="500"
            value={item.price || ''}
            onChange={e => onUpdatePrice(Number(e.target.value))}
            className={`w-full text-xs font-mono font-bold bg-transparent outline-none ${isOutOfRange ? 'text-rose-600 dark:text-rose-400' : 'text-text-main'}`}
            placeholder="Masukkan nominal harga..."
          />
        </div>
        {refPrice > 0 && item.price !== refPrice && !isRange && (
          <button
            type="button"
            onClick={() => onUpdatePrice(refPrice)}
            className="px-2 py-1.5 skeuo-button text-[10px] font-semibold text-text-muted shrink-0 flex items-center gap-1"
            title="Reset harga ke hitungan ukuran"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
      {isRange && (
        <p className={`text-[10px] font-medium ${isOutOfRange ? 'text-rose-500 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
          {isOutOfRange
            ? `Harga di luar rentang ${formatRupiah(minP)} – ${formatRupiah(maxP)} — perbaiki sebelum checkout.`
            : `Rentang standar: ${formatRupiah(minP)} – ${formatRupiah(maxP)}`}
        </p>
      )}
    </div>
  );
};
