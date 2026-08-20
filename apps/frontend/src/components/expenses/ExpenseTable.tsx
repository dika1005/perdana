'use client';

import React from 'react';
import { RefreshCw, FileText, Edit3, Trash2, ChevronLeft, ChevronRight, Layers, Wrench, Users, Receipt } from 'lucide-react';
import { ExpenseCategory, ExpenseItem } from '../../types/expense';

const categoryLabels: Record<ExpenseCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'BAHAN_BAKU': { label: 'Bahan Baku & Tinta', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  'OPERASIONAL': { label: 'Operasional', icon: FileText, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  'MAINTENANCE': { label: 'Perawatan Mesin', icon: Wrench, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  'GAJI': { label: 'Gaji & Upah', icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  'LAINNYA': { label: 'Lain-lain', icon: Receipt, color: 'text-slate-500 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800' },
};

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  canDelete: boolean;
  onPageChange: (newPage: number) => void;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: number) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  loading,
  page,
  totalPages,
  totalCount,
  canDelete,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="skeuo overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5 text-text-muted font-bold border-b border-black/5">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Keterangan</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Nominal</th>
              <th className="p-4">Metode</th>
              <th className="p-4">Dicatat Oleh</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  <p className="text-sm">Memuat pengeluaran...</p>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-text-muted">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-bold">Belum ada pengeluaran</p>
                  <p className="text-xs mt-1 opacity-70">Klik tombol "Catat Pengeluaran" untuk memulai.</p>
                </td>
              </tr>
            ) : (
              expenses.map(exp => {
                const catInfo = categoryLabels[exp.category] || { label: exp.category, color: '' };
                const IconComponent = catInfo.icon || FileText;

                return (
                  <tr key={exp.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-text-muted whitespace-nowrap">
                      {new Date(exp.expense_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    {/* Keterangan + Catatan digabung di satu kolom */}
                    <td className="p-4 max-w-xs">
                      <p className="font-bold text-text-main">{exp.title}</p>
                      {exp.notes && (
                        <p className="text-xs text-text-muted mt-0.5 truncate opacity-70" title={exp.notes}>
                          {exp.notes}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${catInfo.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-red-500 whitespace-nowrap">
                      Rp {Number(exp.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/60 dark:bg-black/40 border border-black/10">
                        {exp.payment_method === 'CASH' ? '💵 Tunai' : '🏦 Transfer'}
                      </span>
                    </td>
                    <td className="p-4 text-text-muted">
                      {exp.creator_name ? (
                        <span className="font-bold text-text-main">{exp.creator_name}</span>
                      ) : (
                        <span className="opacity-60">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(exp)}
                          className="px-2.5 py-1.5 skeuo-button text-text-muted hover:text-brand-600 rounded-lg flex items-center gap-1 text-xs font-bold"
                          title="Edit Pengeluaran"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDelete(exp.id)}
                            className="px-2.5 py-1.5 skeuo-button text-text-muted hover:text-red-600 rounded-lg flex items-center gap-1 text-xs font-bold"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-black/5 flex items-center justify-between text-sm text-text-muted">
        <span>Total: <strong>{totalCount}</strong> Pengeluaran</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="p-2 skeuo-button rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold">Hal {page} / {totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="p-2 skeuo-button rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
