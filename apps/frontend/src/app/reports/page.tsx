'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RefreshCw, Download, TrendingUp, Package, AlertTriangle, CreditCard, Printer } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { transactionService } from '../../services/transactionService';
import {
  DashboardSummary, 
  MonthlySalesReport, 
  TopProductReport, 
  InventoryMutationReport, 
  ReceivableItem, 
  LowStockItem 
} from '../../types/report';
import { PaymentMethod } from '../../types/transaction';
import { useAlert } from '../../context/AlertContext';
import { PageHeader, Button, ErrorBanner, Field, Select, Input } from '../../components/shared';

// Modular Report Components
import { ReportSummaryTab } from '../../components/reports/ReportSummaryTab';
import { ReportReceivablesTab } from '../../components/reports/ReportReceivablesTab';
import { ReportLowStockTab } from '../../components/reports/ReportLowStockTab';
import { ReportMutationsTab } from '../../components/reports/ReportMutationsTab';
import { ReportPayModal } from '../../components/reports/ReportPayModal';
import { ReportPrintModal } from '../../components/reports/ReportPrintModal';

export default function ReportsPage() {
  const { showAlert, showToast } = useAlert();
  const [activeTab, setActiveTab] = useState<'summary' | 'receivables' | 'low_stock' | 'mutations'>('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesReport[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [mutations, setMutations] = useState<InventoryMutationReport[]>([]);

  // Modal Cetak Laporan
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Modal Pelunasan DP
  const [payModal, setPayModal] = useState<{ open: boolean; item?: ReceivableItem | null }>({ open: false });
  const [payAmount, setPayAmount] = useState(0);
  const [payPaymentMethod, setPayPaymentMethod] = useState<PaymentMethod>('CASH');
  const [submittingPay, setSubmittingPay] = useState(false);

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const [sumRes, monthlyRes, topRes, recRes, lowRes, mutRes] = await Promise.all([
        reportService.getSummary(params),
        reportService.getMonthlySales({ year: selectedYear }),
        reportService.getTopProducts(params),
        reportService.getReceivables(params),
        reportService.getLowStock(),
        reportService.getInventoryMutations(params),
      ]);

      setSummary(sumRes);
      setMonthlySales(monthlyRes);
      setTopProducts(topRes);
      setReceivables(recRes);
      setLowStock(lowRes);
      setMutations(mutRes);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedYear]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportsData();
  };

  const handleOpenPay = (item: ReceivableItem) => {
    setPayModal({ open: true, item });
    setPayAmount(Number(item.remaining_amount));
    setPayPaymentMethod('CASH');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal.item || payAmount <= 0) return;
    setSubmittingPay(true);
    try {
      await transactionService.updatePayment(payModal.item.id, payAmount, 'PAID', payPaymentMethod);
      showToast('Pelunasan berhasil dicatat!', 'success');
      setPayModal({ open: false });
      await fetchReportsData();
    } catch (err: any) {
      await showAlert({
        title: 'Gagal Memproses Pelunasan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat memproses pelunasan.',
        type: 'error',
      });
    } finally {
      setSubmittingPay(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'receivables') {
      csvContent += 'Invoice,Pelanggan,Total,Telah Bayar,Sisa Piutang,Status,Tanggal\n';
      receivables.forEach(r => {
        csvContent += `"${r.invoice_number}","${r.customer_name}",${r.total_amount},${r.pay_amount},${r.remaining_amount},"${r.payment_status}","${r.created_at}"\n`;
      });
    } else if (activeTab === 'low_stock') {
      csvContent += 'Bahan,Varian,Satuan,Stok Saat Ini,Batas Minimum\n';
      lowStock.forEach(l => {
        csvContent += `"${l.name}","${l.variant || ''}","${l.unit}",${l.stock},${l.min_stock_warning}\n`;
      });
    } else if (activeTab === 'mutations') {
      csvContent += 'Nama Bahan,Mutasi Masuk (IN),Mutasi Keluar (OUT),Stok Akhir\n';
      mutations.forEach(m => {
        csvContent += `"${m.raw_material_name}",${m.in_qty},${m.out_qty},${m.current_stock}\n`;
      });
    } else {
      csvContent += 'Kode Bulan,Bulan,Omset Penjualan,Pengeluaran,Laba Bersih,Kas Tunai,QRIS,Transfer Bank,Total Transaksi\n';
      monthlySales.forEach(m => {
        csvContent += `"${m.month}","${m.month_name}",${m.total_sales},${m.total_expenses},${m.net_profit},${m.total_cash_omset},${m.total_qris_omset},${m.total_transfer_omset},${m.total_transactions}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_${activeTab}_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Laporan & Rekapitulasi Bisnis"
        subtitle="Analisis pendapatan bulanan, piutang pesanan, kontrol bahan baku, dan mutasi."
        actions={
          <>
            <Button variant="secondary" onClick={fetchReportsData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => setShowPrintModal(true)}>
              <Printer className="w-3.5 h-3.5" />
              Cetak Rekap Bulanan (PDF)
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchReportsData} />}

      {/* Date & Year Filter */}
      <div className="skeuo p-5 mb-6">
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
          <Field label="Tahun Laporan">
            <Select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="w-36"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Mulai">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
          <Button type="submit" variant="secondary">
            Terapkan Filter
          </Button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b border-black/5 dark:border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'summary' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Laporan Bulanan & Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'receivables' ? 'skeuo-inset text-amber-500' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Laporan Piutang DP ({receivables.length})
        </button>
        <button
          onClick={() => setActiveTab('low_stock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'low_stock' ? 'skeuo-inset text-red-500' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Bahan Kritis / Menipis ({lowStock.length})
        </button>
        <button
          onClick={() => setActiveTab('mutations')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'mutations' ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted hover:text-text-main'
          }`}
        >
          <Package className="w-4 h-4" />
          Rekap Mutasi Bahan
        </button>
      </div>

      {/* Tab 1: Summary */}
      {activeTab === 'summary' && (
        <ReportSummaryTab
          summary={summary}
          monthlySales={monthlySales}
          topProducts={topProducts}
          selectedYear={selectedYear}
        />
      )}

      {/* Tab 2: Receivables */}
      {activeTab === 'receivables' && (
        <ReportReceivablesTab
          receivables={receivables}
          onOpenPay={handleOpenPay}
        />
      )}

      {/* Tab 3: Low Stock */}
      {activeTab === 'low_stock' && (
        <ReportLowStockTab
          lowStock={lowStock}
        />
      )}

      {/* Tab 4: Mutations */}
      {activeTab === 'mutations' && (
        <ReportMutationsTab
          mutations={mutations}
        />
      )}

      {/* Modal Pelunasan DP */}
      <ReportPayModal
        isOpen={payModal.open}
        item={payModal.item || null}
        payAmount={payAmount}
        onChangeAmount={setPayAmount}
        paymentMethod={payPaymentMethod}
        onPaymentMethodChange={setPayPaymentMethod}
        submitting={submittingPay}
        onClose={() => setPayModal({ open: false })}
        onSubmit={handleSubmitPayment}
      />

      {/* Modal Cetak Rekap Laporan Bulanan & Keuangan */}
      <ReportPrintModal
        isOpen={showPrintModal}
        selectedYear={selectedYear}
        summary={summary}
        monthlySales={monthlySales}
        topProducts={topProducts}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setShowPrintModal(false)}
      />
    </DashboardLayout>
  );
}
