'use client';

import React from 'react';
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
  isEditOpen: boolean;
  onTogglePriceEdit: () => void;
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
  isEditOpen,
  onTogglePriceEdit,
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
  const minP = Number(item.product.min_price) || 0;
  const maxP = Number(item.product.max_price) || 0;
  const refPrice = meteranRefPrice(item.product, item.length, item.width);
  const isPriceEdited = item.price !== refPrice;
  const isOutOfRange = isRange && ((minP > 0 && item.price < minP) || (maxP > 0 && item.price > maxP));

  const prodUnit = (item.product.unit_name || '').toLowerCase();
  const prodNameLower = (item.product.name || '').toLowerCase();
  const isMeteran = (prodUnit.includes('meter') || prodNameLower.includes('/meter')) && item.length != null && item.width != null;

  const relevantAddons = availableAddons.filter(a =>
    a.category_id === null ||
    a.category_id === undefined ||
    a.category_id === item.product.category_id
  );

  const itemBaseTotal = item.price * item.qty;
  const itemAddonsTotal = (item.addons || []).reduce((sum, a) => sum + ((Number(a.price) || 0) * (Number(a.qty) || 1)), 0);
  const itemGrandTotal = itemBaseTotal + itemAddonsTotal;

  return (
    <div className="rounded-xl skeuo-sm hover:border-brand-300 dark:hover:border-brand-800 transition-all overflow-hidden p-3.5 space-y-2.5">
      <CartItemHeader
        item={item}
        isPriceEdited={isPriceEdited}
        isOutOfRange={isOutOfRange}
        onRemove={onRemove}
      />

      <CartItemPriceEditor
        item={item}
        isEditOpen={isEditOpen}
        refPrice={refPrice}
        isOutOfRange={isOutOfRange}
        onTogglePriceEdit={onTogglePriceEdit}
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

      <CartItemQtyRow
        item={item}
        grandTotal={itemGrandTotal}
        onUpdateQty={onUpdateQty}
        onSetQty={onSetQty}
      />
    </div>
  );
};
