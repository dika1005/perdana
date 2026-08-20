'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../../types/category';

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
          <h2 className="text-base font-bold text-text-main">Kategori Produk</h2>
          <p className="text-xs text-text-muted">Pengelompokan produk cetak (Banner, Stiker, Undangan, Brosur, dll).</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      <div className="space-y-3">
        {categories.map(c => (
          <div key={c.id} className="flex justify-between items-center p-3.5 rounded-xl skeuo-inset">
            <span className="font-bold text-sm text-text-main">{c.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenEditModal(c)}
                className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteCategory(c.id)}
                className="w-8 h-8 flex items-center justify-center skeuo-button text-red-400 hover:text-red-500 rounded-lg"
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
