'use client';

import React from 'react';
import { Eye, CreditCard, Printer, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { PaymentStatus, OrderStatus } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';

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
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">Lunas</span>;
      case 'DP':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">DP Masuk</span>;
      case 'UNPAID':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60">Belum Bayar</span>;
      default:
        return null;
    }
  };

  const getOrderBadge = (status: OrderStatus) => {
    switch (status) {
      case 'ANTRIAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/80 text-slate-700 border border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60">Antrian</span>;
      case 'PROSES':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">Proses</span>;
      case 'SELESAI':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60">Selesai</span>;
      case 'DIAMBIL':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60">Diambil</span>;
      case 'BATAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60">Batal</span>;
      default:
        return null;
    }
  };

  const getPaymentMethodBadge = (tx: any) => {
    const initialMethod = tx.payment_method || 'CASH';
    const settleMethod = tx.settlement_payment_method;

    const renderBadge = (method: string) => {
      switch (method) {
        case 'QRIS':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
              📱 QRIS
            </span>
          );
        case 'TRANSFER':
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60">
              🏦 Transfer
            </span>
          );
        case 'CASH':
        default:
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
              💵 Cash
            </span>
          );
      }
    };

    if (settleMethod && settleMethod !== initialMethod) {
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1"><span className="text-[9px] text-slate-400">DP:</span> {renderBadge(initialMethod)}</div>
          <div className="flex items-center gap-1"><span className="text-[9px] text-slate-400">Lunas:</span> {renderBadge(settleMethod)}</div>
        </div>
      );
    }

    return renderBadge(initialMethod);
  };

  return (
    <div className="skeuo overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-xs">
            <tr>
              <th className="py-3 px-4">No. Nota</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Pelanggan</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Sisa Tagihan</th>
              <th className="py-3 px-4">Status Bayar</th>
              <th className="py-3 px-4">Metode Bayar</th>
              <th className="py-3 px-4">Status Pesanan</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-xs font-medium">Memuat transaksi...</p>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-text-main">Tidak ada data transaksi</p>
                  <p className="text-[11px] mt-0.5 opacity-70">Gunakan filter lain atau buat transaksi baru di POS.</p>
                </td>
              </tr>
            ) : (
              transactions.map(tx => {
                const isPaid = tx.payment_status === 'PAID';
                const sisa = Number(tx.remaining_amount || 0);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {tx.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(tx.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-xs text-text-main">{tx.customer_name || 'Pelanggan Umum'}</p>
                      {tx.customer_phone && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{tx.customer_phone}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-text-main whitespace-nowrap">
                      {formatRupiah(tx.total_amount)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-xs whitespace-nowrap">
                      {sisa > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {formatRupiah(sisa)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentBadge(tx.payment_status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPaymentMethodBadge(tx)}
                    </td>
                    <td className="py-3 px-4">
                      {getOrderBadge(tx.order_status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => onViewDetail(tx.id)}
                          className="p-1.5 skeuo-button text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded-lg"
                          title="Detail Transaksi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isPaid && (
                          <button 
                            onClick={() => onOpenSettle(tx)}
                            className="p-1.5 skeuo-button text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 rounded-lg"
                            title="Pelunasan Sisa Tagihan"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => onPrintInvoice(tx.id)}
                          className="p-1.5 skeuo-button text-slate-600 dark:text-slate-400 hover:text-text-main rounded-lg"
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

      {/* Pagination Bar */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
        <span>
          Menampilkan <b className="text-text-main">{transactions.length}</b> dari <b className="text-text-main">{totalCount}</b> total transaksi
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
