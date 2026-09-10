'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProductAddon } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { CartItem, CartItemMaterial } from './types';
import { meteranRefPrice } from '../../hooks/usePOSState';
import { CartItemHeader } from './cart/CartItemHeader';
import { CartItemPriceEditor } from './cart/CartItemPriceEditor';
import { CartItemDimensions } from './cart/CartItemDimensions';
import { CartItemMaterials } from './cart/CartItemMaterials';
import { CartItemAddons } from './cart/CartItemAddons';
import { CartItemQtyRow } from './cart/CartItemQtyRow';

interface CartItemCardProps {
  item: CartItem;
  rawMaterials: RawMaterial[];
  availableAddons: ProductAddon[];
  onUpdateQty: (delta: number) => void;
  onSetQty: (qty: number) => void;
  onUpdatePrice: (price: number) => void;
  onUpdateDimensions: (length: number, width: number) => void;
  onToggleAddon: (addon: ProductAddon) => void;
  onUpdateAddonQty?: (addonId: number, qty: number) => void;
  onAddMaterial: () => void;
  onUpdateMaterial: (index: number, patch: Partial<CartItemMaterial>) => void;
  onRemoveMaterial: (index: number) => void;
  onRemove: () => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  rawMaterials,
  availableAddons,
  onUpdateQty,
  onSetQty,
  onUpdatePrice,
  onUpdateDimensions,
  onToggleAddon,
  onUpdateAddonQty,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
  onRemove,
}) => {
  const isRange = item.product.price_type === 'RANGE';
  const isCustom = item.product.price_type === 'CUSTOM';
  const minP = Number(item.product.min_price) || 0;
  const maxP = Number(item.product.max_price) || 0;
  const refPrice = meteranRefPrice(item.product, item.length, item.width);
  const isPriceEdited = item.price !== refPrice;
  const isOutOfRange = isRange && ((minP > 0 && item.price < minP) || (maxP > 0 && item.price > maxP));

  const prodUnit = (item.product.unit_name || '').toLowerCase();
  const prodNameLower = (item.product.name || '').toLowerCase();
  const isMeteran = (prodUnit.includes('meter') || prodNameLower.includes('/meter')) && item.length != null && item.width != null;

  // Mode ringkas: panel detail (harga kustom, ukuran, bahan, finishing)
  // hanya dibuka bila pesanan benar-benar butuh input lanjutan —
  // produk polos tampil bersih: nama + qty + subtotal saja.
  const needsMaterial = item.product.uses_material && (item.materials || []).length === 0;
  const needsDetail = isRange || isCustom || isMeteran || needsMaterial;
  const [detailOpen, setDetailOpen] = useState(needsDetail);

  const relevantAddons = availableAddons.filter(a =>
    a.category_id === null ||
    a.category_id === undefined ||
    a.category_id === item.product.category_id
  );

  const hasMaterials = (item.materials || []).length > 0;
  const hasAddons = (item.addons || []).length > 0;
  const detailSummary = [hasMaterials ? 'bahan' : '', hasAddons ? 'finishing' : ''].filter(Boolean).join(' & ');

  return (
    <div className="rounded-xl skeuo-sm hover:border-brand-300 dark:hover:border-brand-800 transition-[background-color,color,transform,box-shadow,border-color] overflow-hidden p-3 space-y-2.5">
      <CartItemHeader
        item={item}
        isPriceEdited={isPriceEdited}
        isOutOfRange={isOutOfRange}
        onRemove={onRemove}
      />

      {detailOpen && (
        <div className="space-y-2.5">
          <CartItemPriceEditor
            item={item}
            isEditOpen
            refPrice={refPrice}
            isOutOfRange={isOutOfRange}
            onTogglePriceEdit={() => setDetailOpen(false)}
            onUpdatePrice={onUpdatePrice}
          />

          {isMeteran && (
            <CartItemDimensions item={item} onUpdateDimensions={onUpdateDimensions} />
          )}

          <CartItemMaterials
            item={item}
            rawMaterials={rawMaterials}
            onAddMaterial={onAddMaterial}
            onUpdateMaterial={onUpdateMaterial}
            onRemoveMaterial={onRemoveMaterial}
          />

          <CartItemAddons
            item={item}
            addons={relevantAddons}
            onToggleAddon={onToggleAddon}
            onUpdateAddonQty={onUpdateAddonQty}
          />
        </div>
      )}

      <CartItemQtyRow
        item={item}
        grandTotal={item.price * item.qty + (item.addons || []).reduce((sum, a) => sum + ((Number(a.price) || 0) * (Number(a.qty) || 1)), 0)}
        onUpdateQty={onUpdateQty}
        onSetQty={onSetQty}
      />

      <button
        type="button"
        onClick={() => setDetailOpen(prev => !prev)}
        aria-expanded={detailOpen}
        aria-label={detailOpen ? `Tutup detail ${item.product.name}` : `Buka detail ${item.product.name}`}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/60 dark:hover:bg-brand-950/30 border border-transparent hover:border-brand-200/70 dark:hover:border-brand-900/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
      >
        <span>{detailOpen ? 'Tutup Detail' : detailSummary ? `Detail (${detailSummary})` : 'Detail — harga, ukuran, bahan, finishing'}</span>
        {detailOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </div>
  );
};
