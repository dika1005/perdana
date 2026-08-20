'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  Wallet, 
  Plus, 
  Search, 
  Calendar, 
  Filter, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  Check, 
  TrendingDown, 
  CreditCard, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  Layers,
  Wrench,
  Users,
  FileText
} from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { authService, UserProfile } from '../../services/authService';
import { 
  ExpenseCategory, 
  ExpenseItem, 
  ExpensePaymentMethod, 
  ExpenseSummary 
} from '../../types/expense';

const categoryLabels: Record<ExpenseCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'BAHAN_BAKU': { label: 'Bahan Baku & Tinta', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  'OPERASIONAL': { label: 'Operasional Harian', icon: FileText, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  'MAINTENANCE': { label: 'Maintenance Mesin', icon: Wrench, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  'GAJI': { label: 'Gaji & Upah Operator', icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  'LAINNYA': { label: 'Lain-lain', icon: Receipt, color: 'text-slate-500 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800' },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | ''>('');
  const [filterPayment, setFilterPayment] = useState<ExpensePaymentMethod | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    category: ExpenseCategory;
    amount: string;
    payment_method: ExpensePaymentMethod;
    notes: string;
    expense_date: string;
  }>({
    title: '',
    category: 'OPERASIONAL',
    amount: '',
    payment_method: 'CASH',
    notes: '',
    expense_date: new Date().toISOString().slice(0, 16),
  });

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, sumRes] = await Promise.all([
        expenseService.getExpenses({
          page,
          per_page: 15,
          search: searchTerm || undefined,
          category: filterCategory || undefined,
          payment_method: filterPayment || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        expenseService.getSummary({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      ]);

      setExpenses(listRes.data);
      if (listRes.meta) {
        setTotalPages(Math.ceil(listRes.meta.total / listRes.meta.per_page) || 1);
        setTotalCount(listRes.meta.total);
      }
      setSummary(sumRes);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      setError(err?.response?.data?.message || 'Gagal memuat daftar pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await authService.me();
        setCurrentUser(u);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, filterCategory, filterPayment]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'OPERASIONAL',
      amount: '',
      payment_method: 'CASH',
      notes: '',
      expense_date: new Date().toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ExpenseItem) => {
    setEditingExpense(item);
    setFormData({
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      payment_method: item.payment_method,
      notes: item.notes || '',
      expense_date: new Date(item.expense_date).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Nominal pengeluaran harus lebih besar dari 0');
      return;
    }

    if (!formData.title.trim()) {
      alert('Judul pengeluaran wajib diisi');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        amount: numAmount,
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || undefined,
        expense_date: new Date(formData.expense_date).toISOString(),
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
      } else {
        await expenseService.createExpense(payload);
      }

      setIsModalOpen(false);
      await fetchExpenses();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan catatan pengeluaran');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(id);
      await fetchExpenses();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus catatan pengeluaran');
    }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Kas Keluar & Pengeluaran</h1>
          <p className="text-text-muted text-sm">
            Pencatatan biaya operasional, pembelian bahan baku, perawatan mesin, dan kas kecil toko.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchExpenses} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 font-bold skeuo-button-primary text-white text-sm bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Catat Pengeluaran
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="skeuo p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Pengeluaran Hari Ini</p>
            <p className="text-xl font-bold text-text-main">
              Rp {Number(summary?.today_amount || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="skeuo p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Pengeluaran Bulan Ini</p>
            <p className="text-xl font-bold text-brand-600">
              Rp {Number(summary?.month_amount || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-brand-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="skeuo p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Total Kas Keluar</p>
            <p className="text-xl font-bold text-red-500">
              Rp {Number(summary?.total_amount || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-red-500">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="skeuo p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Jumlah Transaksi</p>
            <p className="text-xl font-bold text-text-main">
              {summary?.total_count || 0} Kali
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl skeuo-inset flex items-center justify-center text-emerald-500">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="skeuo p-5 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl">
            <Search className="w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari judul pengeluaran / catatan..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as ExpenseCategory | '')}
            className="px-3 py-2.5 skeuo font-medium text-xs text-text-main outline-none bg-transparent rounded-xl"
          >
            <option value="">Semua Kategori</option>
            <option value="BAHAN_BAKU">Bahan Baku & Tinta</option>
            <option value="OPERASIONAL">Operasional Harian</option>
            <option value="MAINTENANCE">Maintenance Mesin</option>
            <option value="GAJI">Gaji & Upah</option>
            <option value="LAINNYA">Lain-lain</option>
          </select>

          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value as ExpensePaymentMethod | '')}
            className="px-3 py-2.5 skeuo font-medium text-xs text-text-main outline-none bg-transparent rounded-xl"
          >
            <option value="">Semua Metode Bayar</option>
            <option value="CASH">Tunai (Kas Laci)</option>
            <option value="TRANSFER">Transfer Bank</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2.5 font-bold skeuo-button text-brand-600 text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Terapkan Filter
          </button>
        </form>
      </div>

      {/* Tabel Pengeluaran */}
      <div className="skeuo p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                <th className="pb-3">Tanggal & Jam</th>
                <th className="pb-3">Judul Pengeluaran</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3">Dicatat Oleh</th>
                <th className="pb-3">Nominal (Rp)</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted text-xs">
                    Memuat data pengeluaran...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted text-xs">
                    Belum ada catatan pengeluaran.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const catInfo = categoryLabels[exp.category] || categoryLabels['LAINNYA'];
                  const Icon = catInfo.icon;

                  return (
                    <tr key={exp.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-3 text-text-muted text-xs whitespace-nowrap">
                        {new Date(exp.expense_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 font-semibold text-text-main text-xs">
                        <div>{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-text-muted font-normal mt-0.5">{exp.notes}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${catInfo.color}`}>
                          <Icon className="w-3 h-3 shrink-0" />
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="py-3 text-xs">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold skeuo-inset text-text-main">
                          {exp.payment_method === 'CASH' ? 'Tunai (Kas)' : 'Transfer Bank'}
                        </span>
                      </td>
                      <td className="py-3 text-text-muted text-xs">
                        {exp.creator_name || 'Kasir'}
                      </td>
                      <td className="py-3 font-bold text-red-500 text-xs whitespace-nowrap">
                        Rp {Number(exp.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                            title="Edit Pengeluaran"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="w-8 h-8 flex items-center justify-center skeuo-button text-red-500 hover:text-red-600 rounded-lg"
                              title="Hapus Pengeluaran (Super Admin only)"
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

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-text-muted/10 text-xs text-text-muted">
          <span>Total {totalCount} catatan pengeluaran</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg skeuo-button disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-text-main px-2">Halaman {page} dari {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg skeuo-button disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Catat / Edit Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 sm:p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-main">
                  {editingExpense ? 'Edit Pengeluaran' : 'Catat Kas Keluar / Pengeluaran'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Uang keluar akan otomatis diperhitungkan dalam pembukuan laba rugi toko.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-text-muted hover:text-text-main p-1.5 rounded-lg skeuo-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-main mb-1">
                  Judul / Keperluan Pengeluaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Tinta Eco-Solvent Cyan 1L, Token Listrik, Lem Banner"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
                  >
                    <option value="BAHAN_BAKU">Bahan Baku & Tinta</option>
                    <option value="OPERASIONAL">Operasional Harian</option>
                    <option value="MAINTENANCE">Maintenance Mesin</option>
                    <option value="GAJI">Gaji & Upah Operator</option>
                    <option value="LAINNYA">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">
                    Metode Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value as ExpensePaymentMethod })}
                    className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
                  >
                    <option value="CASH">Tunai (Kas Laci)</option>
                    <option value="TRANSFER">Transfer Bank</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    placeholder="Contoh: 150000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent font-bold text-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">
                    Tanggal & Waktu
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan toko, no nota supplier, rincian barang, dll."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-text-muted/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold skeuo-button text-text-muted rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-xs font-bold skeuo-button-primary bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
