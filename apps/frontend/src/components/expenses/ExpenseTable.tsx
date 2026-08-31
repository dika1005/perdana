'use client';

import React from 'react';
import { RefreshCw, FileText, Edit3, Trash2, ChevronLeft, ChevronRight, Layers, Wrench, Users, Receipt, Banknote, Landmark } from 'lucide-react';
import { ExpenseCategory, ExpenseItem } from '../../types/expense';
import { formatRupiah } from '../../utils/format';

const categoryLabels: Record<ExpenseCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'BAHAN_BAKU': { label: 'Bahan Baku', icon: Layers, color: 'text-blue-700 bg-blue-50 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60' },
  'OPERASIONAL': { label: 'Operasional', icon: FileText, color: 'text-amber-700 bg-amber-50 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60' },
  'MAINTENANCE': { label: 'Perawatan', icon: Wrench, color: 'text-purple-700 bg-purple-50 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60' },
  'GAJI': { label: 'Gaji & Upah', icon: Users, color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60' },
  'LAINNYA': { label: 'Lain-lain', icon: Receipt, color: 'text-slate-700 bg-slate-100 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
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
          <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-xs">
            <tr>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Nominal</th>
              <th className="py-3 px-4">Metode</th>
              <th className="py-3 px-4">Dicatat Oleh</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-xs font-medium">Memuat pengeluaran...</p>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-text-main">Belum ada pengeluaran</p>
                  <p className="text-[11px] mt-0.5 opacity-70">Klik tombol &quot;Catat Pengeluaran&quot; untuk memulai.</p>
                </td>
              </tr>
            ) : (
              expenses.map(exp => {
                const catInfo = categoryLabels[exp.category] || { label: exp.category, color: '' };
                const IconComponent = catInfo.icon || FileText;

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(exp.expense_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-xs text-text-main">{exp.title}</p>
                      {exp.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={exp.notes}>
                          {exp.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catInfo.color}`}>
                        <IconComponent className="w-3 h-3" />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
                        {exp.payment_method === 'CASH'
                          ? <><Banknote className="w-3 h-3" /> Tunai</>
                          : <><Landmark className="w-3 h-3" /> Transfer</>}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {exp.creator_name || 'Admin'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => onEdit(exp)}
                          className="p-1.5 skeuo-button text-blue-600 dark:text-blue-400 rounded-lg"
                          title="Edit Catatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button 
                            onClick={() => onDelete(exp.id)}
                            className="p-1.5 skeuo-button text-rose-500 hover:text-rose-600 rounded-lg"
                            title="Hapus Pengeluaran"
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

      {/* Pagination Bar */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
        <span>
          Menampilkan <b className="text-text-main">{expenses.length}</b> dari <b className="text-text-main">{totalCount}</b> total catatan
        </span>

        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg skeuo-button disabled:opacity-40 disabled:cursor-not-allowed text-text-main"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-semibold text-text-main px-2">
            Halaman {page} / {totalPages || 1}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg skeuo-button disabled:opacity-40 disabled:cursor-not-allowed text-text-main"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
