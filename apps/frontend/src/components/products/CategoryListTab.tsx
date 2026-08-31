'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../../types/category';
import { Button } from '../shared';

interface CategoryListTabProps {
  categories: Category[];
  onOpenAddModal: () => void;
  onOpenEditModal: (category: Category) => void;
  onDeleteCategory: (id: number) => void;
}

export const CategoryListTab: React.FC<CategoryListTabProps> = ({
  categories,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteCategory,
}) => {
  return (
    <div className="skeuo p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xs font-bold text-text-main">Kategori Produk</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengelompokan produk cetak (Banner, Stiker, Undangan, Brosur, dll).</p>
        </div>
        <Button variant="primary" onClick={onOpenAddModal}>
          <Plus className="w-3.5 h-3.5" />
          Tambah Kategori
        </Button>
      </div>

      <div className="space-y-2.5">
        {categories.map(c => (
          <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="font-semibold text-xs text-text-main">{c.name}</span>
            <div className="flex gap-1">
              <button
                onClick={() => onOpenEditModal(c)}
                className="p-1.5 skeuo-button text-blue-600 dark:text-blue-400 rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="p-1.5 skeuo-button text-rose-500 hover:text-rose-600 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
