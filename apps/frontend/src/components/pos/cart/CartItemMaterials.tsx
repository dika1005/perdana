'use client';

import React from 'react';
import { Package, Plus, X } from 'lucide-react';
import { RawMaterial } from '../../../types/rawMaterial';
import { CartItem, CartItemMaterial } from '../types';

interface CartItemMaterialsProps {
  item: CartItem;
  rawMaterials: RawMaterial[];
  onAddMaterial: () => void;
  onUpdateMaterial: (index: number, patch: Partial<CartItemMaterial>) => void;
  onRemoveMaterial: (index: number) => void;
}

export const CartItemMaterials: React.FC<CartItemMaterialsProps> = ({
  item,
  rawMaterials,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
}) => (
  <div className="rounded-lg border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20 p-2.5 space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
        <Package className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
        <span>Bahan Dipakai (total pesanan):</span>
      </span>
      {item.product.uses_material && (
        <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-1.5 py-0.5 rounded">
          WAJIB
        </span>
      )}
    </div>

    {(item.materials || []).length === 0 && (
      <p className="text-[10px] text-indigo-900/70 dark:text-indigo-300/70">
        {item.product.uses_material
          ? 'Produk ini memakai bahan stok — isi bahan yang digunakan sebelum checkout.'
          : 'Opsional — isi bila pesanan ini memakai bahan stok.'}
      </p>
    )}

    {(item.materials || []).map((material, index) => {
      const selected = rawMaterials.find(r => r.id === material.raw_material_id);
      return (
        <div key={index} className="flex items-center gap-1.5">
          <select
            value={material.raw_material_id || ''}
            onChange={e => onUpdateMaterial(index, { raw_material_id: Number(e.target.value) })}
            className="flex-1 min-w-0 px-2 py-1 text-[11px] font-semibold skeuo-inset outline-none focus:border-indigo-400 text-text-main cursor-pointer"
          >
            <option value="">Pilih bahan...</option>
            {rawMaterials.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.5"
            value={material.material_qty || ''}
            onChange={e => onUpdateMaterial(index, { material_qty: Number(e.target.value) })}
            placeholder="0"
            className="w-16 px-1.5 py-1 text-center text-[11px] font-mono font-bold skeuo-inset outline-none focus:border-indigo-400 text-text-main"
          />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 w-10 shrink-0">
            {selected ? selected.unit : ''}
          </span>
          <span className={`text-[9px] font-mono shrink-0 ${selected && material.material_qty > selected.available_stock ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
            {selected ? `sisa ${Number(selected.available_stock).toLocaleString('id-ID', { maximumFractionDigits: 2 })}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onRemoveMaterial(index)}
            className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
            title="Hapus baris bahan"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    })}

    <button
      type="button"
      onClick={onAddMaterial}
      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
    >
      <Plus className="w-2.5 h-2.5" />
      <span>Tambah bahan</span>
    </button>
    <p className="text-[9px] text-indigo-900/60 dark:text-indigo-300/60">
      Stok dikunci saat DP/lunas dan terpotong saat pekerjaan masuk PROSES.
    </p>
  </div>
);
