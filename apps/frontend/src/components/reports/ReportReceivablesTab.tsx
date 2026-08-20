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
                      onClick={() => onOpenPay(r)}
                      className="px-3 py-1.5 text-xs font-bold skeuo-button text-brand-600 inline-flex items-center gap-1.5 rounded-lg"
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
  );
};
