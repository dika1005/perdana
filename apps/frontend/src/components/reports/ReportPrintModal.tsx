'use client';

import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { DashboardSummary, MonthlySalesReport, TopProductReport } from '../../types/report';
import { formatRupiah } from '../../utils/format';

interface ReportPrintModalProps {
  isOpen: boolean;
  selectedYear: number;
  summary: DashboardSummary | null;
  monthlySales: MonthlySalesReport[];
  topProducts: TopProductReport[];
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  selectedYear,
  summary,
  monthlySales,
  topProducts,
  startDate,
  endDate,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalSales = (monthlySales || []).reduce((sum, m) => sum + Number(m.total_sales || 0), 0);
  const totalExpenses = (monthlySales || []).reduce((sum, m) => sum + Number(m.total_expenses || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const totalTx = (monthlySales || []).reduce((sum, m) => sum + (m.total_transactions || 0), 0);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekap Laporan Keuangan - Percetakan Perdana (${selectedYear})</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 10px;
              font-size: 12px;
              line-height: 1.4;
            }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase; }
            .header p { margin: 2px 0 0; font-size: 11px; color: #475569; }
            .title-badge { display: inline-block; background: #0f172a; color: #fff; font-size: 11px; font-weight: bold; padding: 2px 10px; border-radius: 4px; margin-top: 6px; }
            
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
            .kpi-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
            .kpi-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; }
            .kpi-value { font-size: 14px; font-weight: bold; font-family: monospace; margin-top: 2px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px; font-size: 11px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold; }
            td { border: 1px solid #cbd5e1; padding: 5px 8px; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            
            .section-title { font-size: 13px; font-weight: bold; margin-top: 15px; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
            
            .footer-sign { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 30px; font-size: 11px; }
            .sign-line { border-top: 1px solid #0f172a; margin-top: 50px; margin-left: 40px; margin-right: 40px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Cetak Rekap Laporan Bulanan & Keuangan
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-100 dark:bg-slate-950/60">
          <div 
            ref={printRef}
            className="p-8 bg-white text-slate-900 rounded-xl border border-slate-300 shadow-sm mx-auto max-w-xl"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-lg font-black tracking-tight uppercase">PERDANA PERCETAKAN DIGITAL</h1>
              <p className="text-xs text-slate-600">Laporan Resmi Kinerja Bisnis, Arus Kas & Laba Bersih</p>
              <div className="inline-block bg-slate-900 text-white font-extrabold text-xs px-3 py-0.5 rounded-full mt-1.5 uppercase tracking-wider">
                REKAPITULASI KEUANGAN TAHUN {selectedYear} {startDate && endDate ? `(${startDate} s/d ${endDate})` : ''}
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Omset:</span>
                <span className="text-xs font-black font-mono text-blue-700 block mt-0.5">{formatRupiah(totalSales)}</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Biaya:</span>
                <span className="text-xs font-black font-mono text-rose-700 block mt-0.5">{formatRupiah(totalExpenses)}</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Laba Bersih:</span>
                <span className="text-xs font-black font-mono text-emerald-700 block mt-0.5">{formatRupiah(netProfit)}</span>
              </div>
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Piutang (DP):</span>
                <span className="text-xs font-black font-mono text-amber-700 block mt-0.5">{formatRupiah(summary?.total_piutang)}</span>
              </div>
            </div>

            {/* Monthly Sales Breakdown Table */}
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mt-4 mb-1.5">
              📊 Rincian Penjualan 12 Bulan (Tahun {selectedYear}):
            </h3>
            <table className="w-full text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-1.5 text-left border-r border-slate-300">Bulan</th>
                  <th className="p-1.5 text-right border-r border-slate-300">Omset Penjualan</th>
                  <th className="p-1.5 text-right border-r border-slate-300">Pengeluaran</th>
                  <th className="p-1.5 text-right border-r border-slate-300">Laba Bersih</th>
                  <th className="p-1.5 text-center">Nota</th>
                </tr>
              </thead>
              <tbody>
                {(monthlySales || []).map((m, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="p-1.5 font-bold border-r border-slate-300">{m.month_name || m.month}</td>
                    <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatRupiah(m.total_sales)}</td>
                    <td className="p-1.5 text-right font-mono border-r border-slate-300 text-rose-700">{formatRupiah(m.total_expenses)}</td>
                    <td className="p-1.5 text-right font-mono font-bold border-r border-slate-300 text-emerald-700">{formatRupiah(m.net_profit)}</td>
                    <td className="p-1.5 text-center font-mono">{m.total_transactions}</td>
                  </tr>
                ))}
                <tr className="bg-slate-200/80 font-black border-t-2 border-slate-900">
                  <td className="p-1.5 border-r border-slate-400">TOTAL TAHUNAN</td>
                  <td className="p-1.5 text-right font-mono border-r border-slate-400 text-blue-800">{formatRupiah(totalSales)}</td>
                  <td className="p-1.5 text-right font-mono border-r border-slate-400 text-rose-800">{formatRupiah(totalExpenses)}</td>
                  <td className="p-1.5 text-right font-mono border-r border-slate-400 text-emerald-800">{formatRupiah(netProfit)}</td>
                  <td className="p-1.5 text-center font-mono">{totalTx} Nota</td>
                </tr>
              </tbody>
            </table>

            {/* Top Products */}
            {topProducts && topProducts.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5">
                  🏆 Top 5 Produk Paling Laris:
                </h3>
                <div className="space-y-1">
                  {topProducts.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded bg-slate-50 border border-slate-200">
                      <span><strong>#{idx + 1}</strong> {p.product_name} ({p.total_qty} transaksi)</span>
                      <strong className="font-mono text-blue-700">{formatRupiah(p.total_revenue)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 text-center text-xs font-semibold text-slate-700 mt-8 pt-4">
              <div>
                <p>Kasir / Admin Keuangan</p>
                <div className="border-t border-slate-900 mt-12 mx-8"></div>
              </div>
              <div>
                <p>Owner / Pemilik Toko</p>
                <div className="border-t border-slate-900 mt-12 mx-8"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Laporan siap cetak fisik atau disimpan sebagai file PDF.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold skeuo-button text-slate-600 dark:text-slate-400 text-xs rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
