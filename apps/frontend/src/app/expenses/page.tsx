'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Plus, RefreshCw } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { authService, UserProfile } from '../../services/authService';
import { 
  ExpenseCategory, 
  ExpenseItem, 
  ExpensePaymentMethod, 
  ExpenseSummary 
} from '../../types/expense';

// Modular Expense Components
import { ExpenseSummaryCards } from '../../components/expenses/ExpenseSummaryCards';
import { ExpenseFilterBar } from '../../components/expenses/ExpenseFilterBar';
import { ExpenseTable } from '../../components/expenses/ExpenseTable';
import { ExpenseFormModal } from '../../components/expenses/ExpenseFormModal';

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

  const fetchSummary = async () => {
    try {
      const sum = await expenseService.getSummary();
      setSummary(sum);
    } catch (err: any) {
      console.error('Failed to load expense summary:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await expenseService.getExpenses({
        page,
        per_page: 15,
        search: searchTerm || undefined,
        category: filterCategory || undefined,
        payment_method: filterPayment || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setExpenses(res.data);
      if (res.meta) {
        setTotalPages(Math.ceil(res.meta.total / res.meta.per_page) || 1);
        setTotalCount(res.meta.total);
      }
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      setError(err?.response?.data?.message || 'Gagal memuat riwayat pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    authService.me().then(user => setCurrentUser(user)).catch(() => {});
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, filterCategory, filterPayment, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterPayment('');
    setStartDate('');
    setEndDate('');
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
      amount: item.amount.toString(),
      payment_method: item.payment_method,
      notes: item.notes || '',
      expense_date: item.expense_date ? item.expense_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || undefined,
        expense_date: formData.expense_date ? new Date(formData.expense_date).toISOString() : undefined,
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
      } else {
        await expenseService.createExpense(payload);
      }

      setIsModalOpen(false);
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) return;
    try {
      await expenseService.deleteExpense(id);
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus pengeluaran');
    }
  };

  const canDelete = currentUser?.role === 'SUPER_ADMIN';

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Pengeluaran</h1>
          <p className="text-text-muted text-sm">
            Catat biaya operasional, bahan baku, gaji, dan perawatan mesin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchExpenses();
              fetchSummary();
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
            title="Segarkan data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button-primary bg-brand-500 hover:bg-brand-600 text-white text-xs rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <ExpenseSummaryCards summary={summary} />

      {/* Filter Bar */}
      <ExpenseFilterBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterPayment={filterPayment}
        onFilterPaymentChange={setFilterPayment}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onResetFilters={handleResetFilters}
      />

      {/* Expenses Table */}
      <ExpenseTable
        expenses={expenses}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        canDelete={canDelete}
        onPageChange={setPage}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteExpense}
      />

      {/* Modal Form */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        editingExpense={editingExpense}
        formData={formData}
        formSubmitting={formSubmitting}
        onChange={handleFormChange}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </DashboardLayout>
  );
}
