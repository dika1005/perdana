'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  History, 
  Search, 
  Calendar, 
  Filter, 
  Printer, 
  Eye, 
  RefreshCw, 
  X, 
  CreditCard, 
  Clock, 
  User, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Check
} from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { OrderStatus, PaymentStatus } from '../../types/transaction';

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

  // Modals / Drawers
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [invoicePrintData, setInvoicePrintData] = useState<any | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Modal Pelunasan DP Instan
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

  const handleViewDetail = async (id: number) => {
    setLoadingDetail(true);
    setSelectedTransaction(null);
    try {
      const data = await transactionService.getTransactionById(id);
      setSelectedTransaction(data);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memuat detail transaksi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrintInvoice = async (id: number) => {
    setLoadingInvoice(true);
    try {
      const inv = await transactionService.getInvoiceData(id);
      setInvoicePrintData(inv);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memuat data nota invoice');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleOpenSettle = (t: any) => {
    const remaining = Number(t.total_amount) - Number(t.pay_amount);
    setSettleModal({ open: true, item: t });
    setSettlePayAmount(remaining > 0 ? remaining : 0);
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.item) return;

    const remaining = Number(settleModal.item.total_amount) - Number(settleModal.item.pay_amount);
    if (settlePayAmount <= 0) {
      alert('Jumlah bayar pelunasan harus lebih dari 0');
      return;
    }

    setSubmittingSettle(true);
    try {
      const newStatus = settlePayAmount >= remaining ? 'PAID' : 'DP';
      await transactionService.updatePayment(settleModal.item.id, settlePayAmount, newStatus);
      
      const settledId = settleModal.item.id;
      setSettleModal({ open: false });
      alert('Pelunasan berhasil dicatat!');
      await fetchTransactions();
      
      // Prompt print receipt
      handlePrintInvoice(settledId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memproses pelunasan');
    } finally {
      setSubmittingSettle(false);
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Riwayat Transaksi Penjualan</h1>
          <p className="text-text-muted text-sm">Arsip lengkap transaksi, nota pelanggan, pelunasan DP, dan status pengerjaan.</p>
        </div>
        <button 
          onClick={fetchTransactions} 
          className="flex items-center gap-2 px-4 py-2.5 font-bold skeuo-button text-text-main text-sm"
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
      <div className="skeuo p-5 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl">
            <Search className="w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari no. invoice / nama pelanggan..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 skeuo-inset rounded-xl">
            <Calendar className="w-4 h-4 text-text-muted" />
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-text-main"
            />
          </div>

          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value as PaymentStatus | '')}
            className="px-3 py-2.5 skeuo font-medium text-xs text-text-main outline-none bg-transparent rounded-xl"
          >
            <option value="">Semua Status Bayar</option>
            <option value="PAID">LUNAS (PAID)</option>
            <option value="DP">DP (Uang Muka)</option>
            <option value="UNPAID">BELUM BAYAR</option>
          </select>

          <select
            value={filterOrder}
            onChange={e => setFilterOrder(e.target.value as OrderStatus | '')}
            className="px-3 py-2.5 skeuo font-medium text-xs text-text-main outline-none bg-transparent rounded-xl"
          >
            <option value="">Semua Status Order</option>
            <option value="ANTRIAN">ANTRIAN</option>
            <option value="PROSES">PROSES CETAK</option>
            <option value="SELESAI">SELESAI</option>
            <option value="DIAMBIL">DIAMBIL</option>
          </select>
        </form>
      </div>

      {/* Tabel Transaksi */}
      <div className="skeuo p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-text-muted/20 text-xs font-bold text-text-muted">
                <th className="pb-3">No. Invoice</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Pelanggan</th>
                <th className="pb-3">Kasir</th>
                <th className="pb-3">Status Bayar</th>
                <th className="pb-3">Status Cetak</th>
                <th className="pb-3">Total (Rp)</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted text-xs">
                    Memuat transaksi...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted text-xs">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                transactions.map(t => {
                  const isDP = t.payment_status === 'DP' || t.payment_status === 'UNPAID';
                  const remaining = Number(t.total_amount) - Number(t.pay_amount);

                  return (
                    <tr key={t.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                      <td className="py-3 font-mono font-bold text-text-main text-xs">{t.invoice_number}</td>
                      <td className="py-3 text-text-muted text-xs whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-bold text-text-main text-xs">{t.customer_name || 'Umum'}</td>
                      <td className="py-3 text-text-muted text-xs">{t.cashier_name || 'Kasir'}</td>
                      <td className="py-3 whitespace-nowrap">
                        {t.payment_status === 'PAID' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 skeuo-inset">
                            Lunas
                          </span>
                        )}
                        {t.payment_status === 'DP' && (
                          <div className="flex flex-col">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 skeuo-inset inline-block w-max">
                              DP (Kurang Rp {remaining.toLocaleString('id-ID')})
                            </span>
                          </div>
                        )}
                        {t.payment_status === 'UNPAID' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 skeuo-inset">
                            Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 dark:text-slate-300 skeuo-inset">
                          {t.order_status}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-brand-600 text-xs whitespace-nowrap">
                        Rp {Number(t.total_amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          {isDP && (
                            <button
                              onClick={() => handleOpenSettle(t)}
                              className="px-2.5 py-1.5 flex items-center gap-1.5 skeuo-button text-amber-500 hover:text-amber-600 rounded-lg text-xs font-bold"
                              title="Pelunasan Sisa DP"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Lunasi</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetail(t.id)}
                            className="w-8 h-8 flex items-center justify-center skeuo-button text-brand-500 rounded-lg"
                            title="Lihat Rincian Item"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(t.id)}
                            className="w-8 h-8 flex items-center justify-center skeuo-button text-emerald-600 rounded-lg"
                            title="Cetak Ulang Nota"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
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
          <span>Total {totalCount} transaksi</span>
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

      {/* Modal Pelunasan DP */}
      {settleModal.open && settleModal.item && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 sm:p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-6 pb-2 border-b border-black/10">
              <div>
                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" /> Pelunasan Tagihan DP
                </h2>
                <p className="text-xs text-text-muted mt-0.5 font-mono">
                  {settleModal.item.invoice_number} • {settleModal.item.customer_name || 'Umum'}
                </p>
              </div>
              <button onClick={() => setSettleModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4">
              <div className="p-4 rounded-xl skeuo-inset text-xs space-y-2">
                <div className="flex justify-between text-text-muted">
                  <span>Total Tagihan</span>
                  <span className="font-bold text-text-main">Rp {Number(settleModal.item.total_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Sudah Dibayar (DP)</span>
                  <span className="font-bold text-emerald-600">Rp {Number(settleModal.item.pay_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-red-500 pt-2 border-t border-black/5">
                  <span>Sisa Kurang Bayar</span>
                  <span>Rp {(Number(settleModal.item.total_amount) - Number(settleModal.item.pay_amount)).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-main mb-1">
                  Jumlah Bayar Pelunasan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={settlePayAmount}
                  onChange={e => setSettlePayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-sm text-text-main outline-none bg-transparent font-bold text-brand-600"
                />
              </div>

              {/* Kembalian calculation */}
              {settlePayAmount > (Number(settleModal.item.total_amount) - Number(settleModal.item.pay_amount)) && (
                <div className="p-3 rounded-xl skeuo-inset bg-emerald-50/50 text-emerald-600 text-xs flex justify-between font-bold">
                  <span>Uang Kembalian</span>
                  <span>Rp {(settlePayAmount - (Number(settleModal.item.total_amount) - Number(settleModal.item.pay_amount))).toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSettleModal({ open: false })}
                  className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSettle}
                  className="flex-1 py-2.5 font-bold skeuo-button-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  {submittingSettle ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Proses Pelunasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">
                  {selectedTransaction.invoice_number}
                </span>
                <h2 className="text-xl font-bold text-text-main mt-2">Detail Transaksi Pesanan</h2>
                <p className="text-xs text-text-muted">
                  Pemesan: <strong>{selectedTransaction.customer_name || 'Umum'}</strong> • Kasir: {selectedTransaction.cashier_name || '-'}
                </p>
              </div>
              <button onClick={() => setSelectedTransaction(null)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Item */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Item & Add-ons Cetak</h3>
              {selectedTransaction.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl skeuo-inset text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-text-main">
                    <span>
                      {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.qty}
                    </span>
                    <span>Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                  {item.addons && item.addons.length > 0 && (
                    <div className="pl-3 border-l-2 border-brand-300 text-text-muted space-y-0.5 text-[11px]">
                      {item.addons.map((ad: any, aIdx: number) => (
                        <div key={aIdx} className="flex justify-between">
                          <span>+ {ad.addon_name} (×{ad.qty})</span>
                          <span>Rp {Number(ad.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="p-4 rounded-xl skeuo-inset bg-brand-50/30 text-xs space-y-2 mb-6">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>Rp {Number(selectedTransaction.subtotal_amount).toLocaleString('id-ID')}</span>
              </div>
              {Number(selectedTransaction.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon</span>
                  <span>- Rp {Number(selectedTransaction.discount_amount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-text-main pt-2 border-t border-black/5">
                <span>Total Belanja</span>
                <span className="text-brand-600">Rp {Number(selectedTransaction.total_amount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Telah Dibayar</span>
                <span className="font-bold">Rp {Number(selectedTransaction.pay_amount).toLocaleString('id-ID')}</span>
              </div>
              {Number(selectedTransaction.total_amount) > Number(selectedTransaction.pay_amount) && (
                <div className="flex justify-between text-red-500 font-bold">
                  <span>Sisa Piutang (DP)</span>
                  <span>Rp {(Number(selectedTransaction.total_amount) - Number(selectedTransaction.pay_amount)).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const id = selectedTransaction.id;
                  setSelectedTransaction(null);
                  handlePrintInvoice(id);
                }}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 flex items-center justify-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Nota Thermal */}
      {invoicePrintData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/10">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand-500" /> Preview Nota Cetak
              </h3>
              <button onClick={() => setInvoicePrintData(null)} className="text-text-muted hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Preview */}
            <div id="thermal-receipt" className="bg-white text-black p-4 font-mono text-[11px] leading-tight rounded-lg shadow-inner mb-4 space-y-2 border border-slate-300">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <p className="font-bold text-sm">{invoicePrintData.store_name || 'PERDANA PERCETAKAN'}</p>
                <p className="text-[10px] text-slate-600">{invoicePrintData.store_address || 'Jl. Raya Percetakan No. 88'}</p>
                <p className="text-[10px] text-slate-600">WA: {invoicePrintData.store_phone || '0812-3456-7890'}</p>
              </div>

              <div className="py-1 text-[10px] text-slate-700 space-y-0.5">
                <div className="flex justify-between">
                  <span>No: {invoicePrintData.invoice_number}</span>
                  <span>{new Date(invoicePrintData.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir: {invoicePrintData.cashier_name}</span>
                  <span>Plg: {invoicePrintData.customer_name}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Status: {invoicePrintData.payment_status}</span>
                  <span>Order: {invoicePrintData.order_status}</span>
                </div>
              </div>

              <div className="py-2 border-y border-dashed border-slate-400 space-y-1.5">
                {invoicePrintData.items?.map((it: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between font-semibold">
                      <span>{it.product_name} × {it.qty}</span>
                      <span>Rp {Number(it.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                    {it.addons?.map((ad: any, aI: number) => (
                      <div key={aI} className="flex justify-between text-[10px] text-slate-500 pl-2">
                        <span>+ {ad.addon_name}</span>
                        <span>Rp {Number(ad.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="pt-1 text-[10px] space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {Number(invoicePrintData.subtotal_amount).toLocaleString('id-ID')}</span>
                </div>
                {Number(invoicePrintData.discount_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Diskon</span>
                    <span>- Rp {Number(invoicePrintData.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL</span>
                  <span>Rp {Number(invoicePrintData.total_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>BAYAR</span>
                  <span>Rp {Number(invoicePrintData.pay_amount).toLocaleString('id-ID')}</span>
                </div>
                {Number(invoicePrintData.remaining_amount) > 0 ? (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>SISA PIUTANG</span>
                    <span>Rp {Number(invoicePrintData.remaining_amount).toLocaleString('id-ID')}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>KEMBALI</span>
                    <span>Rp {Number(invoicePrintData.change_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-400 text-[9px] text-slate-500">
                <p>Terima kasih atas pesanan Anda!</p>
                <p>Barang yang sudah dicetak tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setInvoicePrintData(null)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
              >
                Tutup
              </button>
              <button
                onClick={triggerBrowserPrint}
                className="flex-1 py-2.5 font-bold skeuo-button bg-brand-500 text-white shadow-none border-none hover:bg-brand-600 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
