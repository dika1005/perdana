'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { ReceivableItem } from '../../types/report';

interface ReportReceivablesTabProps {
  receivables: ReceivableItem[];
  onOpenPay: (item: ReceivableItem) => void;
}

export const ReportReceivablesTab: React.FC<ReportReceivablesTabProps> = ({
  receivables,
  onOpenPay,
}) => {
  return (
    <div className="skeuo p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-xs text-text-main">Laporan Piutang Pesanan (DP & Belum Lunas)</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Daftar pesanan dengan sisa tagihan yang belum diselesaikan.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">No. Invoice</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Pelanggan</th>
              <th className="py-3 px-4">Total Belanja</th>
              <th className="py-3 px-4">Telah Dibayar</th>
              <th className="py-3 px-4">Sisa Piutang</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
            {receivables.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                  Semua transaksi sudah lunas! Tidak ada piutang tertunggak.
                </td>
              </tr>
            ) : (
              receivables.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{r.invoice_number}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-text-main text-xs">{r.customer_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-text-main">Rp {Number(r.total_amount).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Rp {Number(r.pay_amount).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-400 font-bold text-xs">Rp {Number(r.remaining_amount).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60">
                      {r.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPay(r)}
                      className="px-2.5 py-1 text-xs font-semibold skeuo-button text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 rounded-lg"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Lunasi
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
