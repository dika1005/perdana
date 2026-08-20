'use client';

import React from 'react';
import { RefreshCw, FileText, Edit3, Trash2, ChevronLeft, ChevronRight, Layers, Wrench, Users, Receipt } from 'lucide-react';
import { ExpenseCategory, ExpenseItem } from '../../types/expense';

const categoryLabels: Record<ExpenseCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'BAHAN_BAKU': { label: 'Bahan Baku & Tinta', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  'OPERASIONAL': { label: 'Operasional Harian', icon: FileText, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  'MAINTENANCE': { label: 'Maintenance Mesin', icon: Wrench, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  'GAJI': { label: 'Gaji & Upah Operator', icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
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
        <table className="w-full text-left text-xs">
          <thead className="bg-black/5 dark:bg-white/5 text-text-muted font-bold border-b border-black/5">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Keterangan</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Nominal</th>
              <th className="p-4">Metode Bayar</th>
              <th className="p-4">Dicatat Oleh</th>
              <th className="p-4">Catatan</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  Memuat data pengeluaran...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Belum ada catatan pengeluaran.
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
                    <td className="p-4 font-bold text-text-main">{exp.title}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${catInfo.color}`}>
                        <IconComponent className="w-3 h-3" />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-red-500 text-sm whitespace-nowrap">
                      Rp {Number(exp.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/60 dark:bg-black/40 border border-black/10">
                        {exp.payment_method === 'CASH' ? 'Tunai (Cash)' : 'Transfer Bank'}
                      </span>
                    </td>
                    <td className="p-4 text-text-muted">
                      {exp.creator_name ? (
                        <span className="font-semibold text-text-main">{exp.creator_name}</span>
                      ) : (
                        <span className="opacity-60">-</span>
                      )}
                    </td>
                    <td className="p-4 text-text-muted max-w-xs truncate" title={exp.notes || ''}>
                      {exp.notes || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(exp)}
                          className="p-1.5 skeuo-button text-text-muted hover:text-brand-600 rounded-lg"
                          title="Edit Pengeluaran"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDelete(exp.id)}
                            className="p-1.5 skeuo-button text-text-muted hover:text-red-600 rounded-lg"
                            title="Hapus Pengeluaran (Owner Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      <div className="p-4 border-t border-black/5 flex items-center justify-between text-xs text-text-muted">
        <span>Total: <strong>{totalCount}</strong> Pengeluaran</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 skeuo-button rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold">Halaman {page} dari {totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 skeuo-button rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
