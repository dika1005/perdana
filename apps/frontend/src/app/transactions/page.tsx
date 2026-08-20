'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { OrderStatus, PaymentStatus } from '../../types/transaction';

// Modular Transaction Components
import { TransactionFilterBar } from '../../components/transactions/TransactionFilterBar';
import { TransactionTable } from '../../components/transactions/TransactionTable';
import { TransactionDetailDrawer } from '../../components/transactions/TransactionDetailDrawer';
import { TransactionSettleModal } from '../../components/transactions/TransactionSettleModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';

export default function TransactionsHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | ''>('');
  const [filterOrder, setFilterOrder] = useState<OrderStatus | ''>('');

  // Modals & Drawers
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [invoicePrintData, setInvoicePrintData] = useState<any | null>(null);
  const [settleModal, setSettleModal] = useState<{ open: boolean; item?: any | null }>({ open: false });
  const [settlePayAmount, setSettlePayAmount] = useState<number>(0);
  const [submittingSettle, setSubmittingSettle] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.getTransactions({
        page,
        per_page: 15,
        search: searchTerm || undefined,
        date: filterDate || undefined,
        payment_status: filterPayment ? (filterPayment as PaymentStatus) : undefined,
        order_status: filterOrder ? (filterOrder as OrderStatus) : undefined,
      });
      setTransactions(res.data);
      if (res.meta) {
        setTotalPages(Math.ceil(res.meta.total / res.meta.per_page) || 1);
        setTotalCount(res.meta.total);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(err?.response?.data?.message || 'Gagal memuat riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filterPayment, filterOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setFilterPayment('');
    setFilterOrder('');
    setPage(1);
    fetchTransactions();
  };

  const handleViewDetail = async (id: number) => {
    try {
      const data = await transactionService.getTransactionById(id);
      setSelectedTransaction(data);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memuat detail transaksi');
    }
  };

  const handlePrintInvoice = async (id: number) => {
    try {
      const data = await transactionService.getInvoiceData(id);
      setInvoicePrintData(data);
    } catch {
      const tx = transactions.find(t => t.id === id);
      setInvoicePrintData(tx);
    }
  };

  const handleOpenSettle = (item: any) => {
    const remaining = Number(item.total_amount) - Number(item.pay_amount);
    setSettleModal({ open: true, item });
    setSettlePayAmount(remaining > 0 ? remaining : 0);
  };

  const handleProcessSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.item) return;
    setSubmittingSettle(true);
    try {
      const res = await transactionService.updatePayment(settleModal.item.id, settlePayAmount, 'PAID');
      setSettleModal({ open: false });
      alert('Pelunasan berhasil dicatat!');
      await fetchTransactions();
      
      try {
        const inv = await transactionService.getInvoiceData(res.id);
        setInvoicePrintData(inv);
      } catch {
        setInvoicePrintData(res);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memproses pelunasan');
    } finally {
      setSubmittingSettle(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Riwayat Transaksi</h1>
          <p className="text-text-muted text-sm">Daftar semua transaksi, status pembayaran DP, dan cetak ulang nota.</p>
        </div>
        <button 
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-4 py-2 font-bold skeuo-button text-text-main text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <TransactionFilterBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        filterDate={filterDate}
        onFilterDateChange={setFilterDate}
        filterPayment={filterPayment}
        onFilterPaymentChange={setFilterPayment}
        filterOrder={filterOrder}
        onFilterOrderChange={setFilterOrder}
        onResetFilters={handleResetFilters}
      />

      {/* Data Table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onViewDetail={handleViewDetail}
        onOpenSettle={handleOpenSettle}
        onPrintInvoice={handlePrintInvoice}
      />

      {/* Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      {/* Settle Modal */}
      <TransactionSettleModal
        isOpen={settleModal.open}
        item={settleModal.item}
        payAmount={settlePayAmount}
        onPayAmountChange={setSettlePayAmount}
        submitting={submittingSettle}
        onClose={() => setSettleModal({ open: false })}
        onSubmit={handleProcessSettle}
      />

      {/* Shared Receipt Thermal Slip Modal */}
      <ReceiptModal
        invoiceData={invoicePrintData}
        onClose={() => setInvoicePrintData(null)}
        onPrint={() => window.print()}
      />
    </DashboardLayout>
  );
}
