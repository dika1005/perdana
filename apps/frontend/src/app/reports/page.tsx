'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  TrendingUp, 
  Package, 
  Layers, 
  CreditCard, 
  X, 
  Check 
} from 'lucide-react';
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
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-emerald-600 text-sm"
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
          <button type="submit" className="px-5 py-2 font-bold skeuo-button text-text-main text-xs">
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="skeuo p-5">
              <span className="text-xs text-text-muted">Total Omset</span>
              <p className="text-xl font-bold text-brand-600 mt-1">Rp {(summary?.total_omset || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="skeuo p-5">
              <span className="text-xs text-text-muted">Transaksi Lunas (PAID)</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{summary?.paid_transactions || 0} Transaksi</p>
            </div>
            <div className="skeuo p-5">
              <span className="text-xs text-text-muted">Total Piutang (DP/Unpaid)</span>
              <p className="text-xl font-bold text-amber-500 mt-1">Rp {(summary?.total_piutang || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="skeuo p-5">
              <span className="text-xs text-text-muted">Total Transaksi</span>
              <p className="text-xl font-bold text-text-main mt-1">{summary?.total_transactions || 0} Nota</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="skeuo p-6">
              <h3 className="font-bold text-sm text-text-main mb-4">Grafik Penjualan Harian</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {dailySales.length === 0 ? (
                  <p className="text-xs text-text-muted py-6 text-center">Belum ada transaksi pada periode ini.</p>
                ) : (
                  dailySales.map((d, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl skeuo-inset text-xs font-semibold">
                      <span>{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      <span className="text-text-muted">{d.total_transactions} nota</span>
                      <span className="font-bold text-brand-600">Rp {Number(d.total_sales).toLocaleString('id-ID')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="skeuo p-6">
              <h3 className="font-bold text-sm text-text-main mb-4">Top 5 Produk Terlaris</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-text-muted py-6 text-center">Belum ada produk terjual.</p>
                ) : (
                  topProducts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl skeuo-inset text-xs font-semibold">
                      <span className="truncate max-w-[200px]">#{i+1} {p.product_name}</span>
                      <span className="text-text-muted">{p.total_qty} terjual</span>
                      <span className="font-bold text-brand-600">Rp {Number(p.total_revenue).toLocaleString('id-ID')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Receivables */}
      {activeTab === 'receivables' && (
        <div className="skeuo p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-text-main">Laporan Piutang Pesanan (DP & Belum Lunas)</h3>
              <p className="text-xs text-text-muted">Daftar pesanan dengan sisa tagihan yang belum diselesaikan.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                  <th className="pb-3">No. Invoice</th>
                  <th className="pb-3">Tanggal</th>
                  <th className="pb-3">Pelanggan</th>
                  <th className="pb-3">Total Belanja</th>
                  <th className="pb-3">Telah Dibayar</th>
                  <th className="pb-3">Sisa Piutang</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {receivables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted text-xs">
                      Semua transaksi sudah lunas! Tidak ada piutang tertunggak.
                    </td>
                  </tr>
                ) : (
                  receivables.map(r => (
                    <tr key={r.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-text-main text-xs">{r.invoice_number}</td>
                      <td className="py-3.5 text-text-muted text-xs">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3.5 font-bold text-text-main text-xs">{r.customer_name}</td>
                      <td className="py-3.5 text-xs">Rp {Number(r.total_amount).toLocaleString('id-ID')}</td>
                      <td className="py-3.5 text-emerald-600 text-xs font-semibold">Rp {Number(r.pay_amount).toLocaleString('id-ID')}</td>
                      <td className="py-3.5 text-red-500 font-bold text-xs">Rp {Number(r.remaining_amount).toLocaleString('id-ID')}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold text-amber-500 bg-amber-50 skeuo-inset">
                          {r.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleOpenPay(r)}
                          className="px-3 py-1.5 text-xs font-bold skeuo-button text-brand-600 inline-flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Lunasi Sekarang
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Low Stock */}
      {activeTab === 'low_stock' && (
        <div className="skeuo p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-text-main">Peringatan Bahan Baku Kritis / Menipis</h3>
              <p className="text-xs text-text-muted">Bahan dengan stok fisik $\le$ batas minimum yang perlu segera direstock.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                  <th className="pb-3">Nama Bahan Baku</th>
                  <th className="pb-3">Varian</th>
                  <th className="pb-3">Satuan</th>
                  <th className="pb-3">Stok Saat Ini</th>
                  <th className="pb-3">Batas Minimum</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                      Seluruh stok bahan baku dalam kondisi aman.
                    </td>
                  </tr>
                ) : (
                  lowStock.map(l => (
                    <tr key={l.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-3.5 font-bold text-text-main text-xs">{l.name}</td>
                      <td className="py-3.5 text-text-muted text-xs">{l.variant || '-'}</td>
                      <td className="py-3.5 text-text-muted text-xs">{l.unit}</td>
                      <td className="py-3.5 font-bold text-red-500 text-sm">{l.stock} {l.unit}</td>
                      <td className="py-3.5 text-text-muted text-xs">{l.min_stock_warning} {l.unit}</td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold text-red-500 bg-red-50 skeuo-inset flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" /> Kritis / Perlu Restock
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Mutations */}
      {activeTab === 'mutations' && (
        <div className="skeuo p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-text-main">Rekapitulasi Mutasi Stok Bahan Baku</h3>
              <p className="text-xs text-text-muted">Total kuantitas barang masuk (IN) dan barang keluar (OUT) per item bahan.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                  <th className="pb-3">Nama Bahan Baku</th>
                  <th className="pb-3">Total Masuk (IN)</th>
                  <th className="pb-3">Total Keluar (OUT)</th>
                  <th className="pb-3">Stok Akhir Fisik</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {mutations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted text-xs">
                      Belum ada data mutasi bahan.
                    </td>
                  </tr>
                ) : (
                  mutations.map(m => (
                    <tr key={m.raw_material_id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-3.5 font-bold text-text-main text-xs">{m.raw_material_name}</td>
                      <td className="py-3.5 text-emerald-600 font-bold text-xs">+{m.in_qty}</td>
                      <td className="py-3.5 text-red-500 font-bold text-xs">-{m.out_qty}</td>
                      <td className="py-3.5 font-bold text-text-main text-sm">{m.current_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Pelunasan DP */}
      {payModal.open && payModal.item && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmitPayment} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-main">Pelunasan Tagihan DP</h2>
                <p className="text-xs text-text-muted">{payModal.item.invoice_number} • {payModal.item.customer_name}</p>
              </div>
              <button type="button" onClick={() => setPayModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl skeuo-inset bg-amber-50/40 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between text-text-muted">
                <span>Total Belanja:</span>
                <span className="font-bold">Rp {Number(payModal.item.total_amount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Telah Dibayar Sebelumnya (DP):</span>
                <span className="font-bold">Rp {Number(payModal.item.pay_amount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-black/5">
                <span>Sisa Tagihan:</span>
                <span>Rp {Number(payModal.item.remaining_amount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nominal Pelunasan Diterima (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold text-base"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPayModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingPay}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm"
              >
                {submittingPay ? 'Memproses...' : 'Konfirmasi Lunas'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
