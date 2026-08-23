'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw, Download } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { OrderStatus, PaymentStatus } from '../../types/transaction';

// Modular Transaction Components
import { TransactionFilterBar } from '../../components/transactions/TransactionFilterBar';
import { TransactionTable } from '../../components/transactions/TransactionTable';
import { TransactionDetailDrawer } from '../../components/transactions/TransactionDetailDrawer';
import { TransactionSettleModal } from '../../components/transactions/TransactionSettleModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { useAlert } from '../../context/AlertContext';

export default function TransactionsHistoryPage() {
  const { showAlert, showToast } = useAlert();
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
      await showAlert({
        title: 'Gagal Memuat Detail Transaksi',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat memuat rincian transaksi.',
        type: 'error',
      });
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
      showToast('Pelunasan berhasil dicatat!', 'success');
      await fetchTransactions();
      
      try {
        const inv = await transactionService.getInvoiceData(res.id);
        setInvoicePrintData(inv);
      } catch {
        setInvoicePrintData(res);
      }
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Memproses Pelunasan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat memproses pelunasan transaksi.',
        type: 'error',
      });
    } finally {
      setSubmittingSettle(false);
    }
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['No. Nota', 'Tanggal', 'Pelanggan', 'No. Telepon', 'Total Belanja', 'Telah Dibayar', 'Sisa Piutang', 'Status Bayar', 'Status Pesanan'];
    const rows = transactions.map(t => [
      `"${t.invoice_number}"`,
      `"${new Date(t.created_at).toISOString().slice(0, 10)}"`,
      `"${(t.customer_name || 'Pelanggan Umum').replace(/"/g, '""')}"`,
      `"${(t.customer_phone || '').replace(/"/g, '""')}"`,
      t.total_amount,
      t.pay_amount,
      t.remaining_amount || (Number(t.total_amount) - Number(t.pay_amount)),
      `"${t.payment_status}"`,
      `"${t.order_status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_perdana_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Data transaksi berhasil diekspor ke CSV!', 'success');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-1">Riwayat Transaksi</h1>
          <p className="text-text-muted text-xs sm:text-sm">Daftar semua transaksi kasir, status pembayaran DP, pelunasan, dan cetak ulang nota.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 font-bold skeuo-button text-text-main text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Ekspor daftar transaksi saat ini ke CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Ekspor CSV</span>
          </button>
          <button 
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-3.5 py-2 font-bold skeuo-button text-text-main text-xs rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
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
