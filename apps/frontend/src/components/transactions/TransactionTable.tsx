'use client';

import React from 'react';
import { Eye, CreditCard, Printer, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '../../types/transaction';

interface TransactionTableProps {
  transactions: any[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onViewDetail: (id: number) => void;
  onOpenSettle: (tx: any) => void;
  onPrintInvoice: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onViewDetail,
  onOpenSettle,
  onPrintInvoice,
}) => {
  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">LUNAS</span>;
      case 'DP':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">DP</span>;
      case 'UNPAID':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">BELUM BAYAR</span>;
      default:
        return null;
    }
  };

  const getOrderBadge = (status: OrderStatus) => {
    switch (status) {
      case 'ANTRIAN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Antrian</span>;
      case 'PROSES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Proses</span>;
      case 'SELESAI':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">Selesai</span>;
      case 'DIAMBIL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Diambil</span>;
      default:
        return null;
    }
  };

  return (
    <div className="skeuo overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/5 dark:bg-white/5 text-text-muted font-bold border-b border-black/5">
            <tr>
              <th className="p-4">No. Nota</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Total</th>
              <th className="p-4">Dibayar</th>
              <th className="p-4">Sisa Tagihan</th>
              <th className="p-4">Status Bayar</th>
              <th className="p-4">Status Produksi</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  Memuat data transaksi...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Tidak ada transaksi yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              transactions.map(tx => {
                const total = Number(tx.total_amount) || 0;
                const paid = Number(tx.pay_amount) || 0;
                const remaining = Math.max(0, total - paid);
                const isDP = tx.payment_status === 'DP' || tx.payment_status === 'UNPAID';

                return (
                  <tr key={tx.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-600">{tx.invoice_number}</td>
                    <td className="p-4 text-text-muted">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 font-bold text-text-main">{tx.customer_name || 'Pelanggan Umum'}</td>
                    <td className="p-4 font-mono font-bold">Rp {total.toLocaleString('id-ID')}</td>
                    <td className="p-4 font-mono text-emerald-600">Rp {paid.toLocaleString('id-ID')}</td>
                    <td className="p-4 font-mono">
                      {remaining > 0 ? (
                        <span className="font-bold text-red-500">Rp {remaining.toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-4">{getPaymentBadge(tx.payment_status)}</td>
                    <td className="p-4">{getOrderBadge(tx.order_status)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetail(tx.id)}
                          className="p-1.5 skeuo-button text-text-muted hover:text-brand-600 rounded-lg"
                          title="Lihat Detail Nota"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Tombol Pelunasan DP */}
                        {isDP && (
                          <button
                            onClick={() => onOpenSettle(tx)}
                            className="px-2 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold rounded-lg hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1"
                            title="Lunasi Tagihan DP"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Lunasi</span>
                          </button>
                        )}

                        <button
                          onClick={() => onPrintInvoice(tx.id)}
                          className="p-1.5 skeuo-button text-text-muted hover:text-emerald-600 rounded-lg"
                          title="Cetak Struk Thermal"
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-black/5 flex items-center justify-between text-xs text-text-muted">
        <span>Total: <strong>{totalCount}</strong> Transaksi</span>
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
