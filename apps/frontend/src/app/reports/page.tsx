'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Calendar, RefreshCw, Download, TrendingUp, Package, AlertTriangle, CreditCard } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { transactionService } from '../../services/transactionService';
import { 
  DashboardSummary, 
  DailySalesReport, 
  TopProductReport, 
  InventoryMutationReport, 
  ReceivableItem, 
  LowStockItem 
} from '../../types/report';

// Modular Report Components
import { ReportSummaryTab } from '../../components/reports/ReportSummaryTab';
import { ReportReceivablesTab } from '../../components/reports/ReportReceivablesTab';
import { ReportLowStockTab } from '../../components/reports/ReportLowStockTab';
import { ReportMutationsTab } from '../../components/reports/ReportMutationsTab';
import { ReportPayModal } from '../../components/reports/ReportPayModal';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'receivables' | 'low_stock' | 'mutations'>('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesReport[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [mutations, setMutations] = useState<InventoryMutationReport[]>([]);

  // Modal Pelunasan DP
  const [payModal, setPayModal] = useState<{ open: boolean; item?: ReceivableItem | null }>({ open: false });
  const [payAmount, setPayAmount] = useState(0);
  const [submittingPay, setSubmittingPay] = useState(false);

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const [sumRes, salesRes, topRes, recRes, lowRes, mutRes] = await Promise.all([
        reportService.getSummary(params),
        reportService.getDailySales(params),
        reportService.getTopProducts(params),
        reportService.getReceivables(params),
        reportService.getLowStock(),
        reportService.getInventoryMutations(params),
      ]);

      setSummary(sumRes);
      setDailySales(salesRes);
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
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportsData();
  };

  const handleOpenPay = (item: ReceivableItem) => {
    setPayModal({ open: true, item });
    setPayAmount(Number(item.remaining_amount));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal.item || payAmount <= 0) return;
    setSubmittingPay(true);
    try {
      await transactionService.updatePayment(payModal.item.id, payAmount, 'PAID');
      alert('Pelunasan berhasil dicatat!');
      setPayModal({ open: false });
      await fetchReportsData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memproses pelunasan');
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
      csvContent += 'Tanggal,Total Penjualan,Jumlah Transaksi\n';
      dailySales.forEach(d => {
        csvContent += `"${d.date}",${d.total_sales},${d.total_transactions}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Laporan & Rekapitulasi Bisnis</h1>
          <p className="text-text-muted text-sm">Analisis pendapatan, piutang pesanan, kontrol bahan baku, dan mutasi.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={fetchReportsData} 
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-emerald-600 text-sm rounded-xl"
          >
            <Download className="w-4 h-4" />
            Export CSV / Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Date Filter */}
      <div className="skeuo p-5 mb-6">
        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 skeuo-inset rounded-xl">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Mulai:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-text-main"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 skeuo-inset rounded-xl">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">Sampai:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-text-main"
            />
          </div>
          <button type="submit" className="px-5 py-2 font-bold skeuo-button text-text-main text-xs rounded-xl">
            Terapkan Periode
          </button>
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
          Ringkasan & Harian
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
          dailySales={dailySales}
          topProducts={topProducts}
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
        submitting={submittingPay}
        onClose={() => setPayModal({ open: false })}
        onSubmit={handleSubmitPayment}
      />
    </DashboardLayout>
  );
}
