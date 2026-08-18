'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Calendar, DollarSign, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { reportService } from '../../services/reportService';
import { DashboardSummary } from '../../types/report';

export default function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, transRes] = await Promise.all([
        reportService.getSummary({ 
          start_date: startDate || undefined, 
          end_date: endDate || undefined 
        }),
        transactionService.getTransactions({ 
          date: startDate || undefined 
        }),
      ]);
      setSummary(sumRes);
      setTransactions(transRes.data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">Laporan Transaksi</h1>
          <p className="text-text-muted">Rekapitulasi pendapatan dan transaksi langsung dari database.</p>
        </div>
        <button 
          onClick={fetchReports} 
          className="flex items-center gap-2 px-4 py-3 font-bold skeuo-button text-text-main"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="skeuo p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center text-brand-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-text-muted font-medium mb-1">Total Omset</h3>
            <p className="text-2xl font-bold text-text-main">
              Rp {(summary?.total_omset || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        
        <div className="skeuo p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-text-muted font-medium mb-1">Transaksi Lunas (PAID)</h3>
            <p className="text-2xl font-bold text-text-main">
              {summary?.paid_transactions || 0} Transaksi
            </p>
          </div>
        </div>

        <div className="skeuo p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl skeuo-inset flex items-center justify-center text-amber-500">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-text-muted font-medium mb-1">Total Piutang (DP / Belum Lunas)</h3>
            <p className="text-2xl font-bold text-text-main">
              Rp {(summary?.total_piutang || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="skeuo p-6">
        <form onSubmit={handleFilter} className="flex gap-4 mb-6">
          <div className="flex items-center gap-3 px-4 py-3 skeuo-inset w-64">
            <Calendar className="w-5 h-5 text-text-muted" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-text-main"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 skeuo-inset w-64">
            <Calendar className="w-5 h-5 text-text-muted" />
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-text-main"
            />
          </div>
          <button type="submit" className="px-6 py-3 font-bold skeuo-button text-text-main">
            Filter Tanggal
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-text-muted/20">
                <th className="pb-4 font-bold text-text-muted">No. Invoice</th>
                <th className="pb-4 font-bold text-text-muted">Tanggal</th>
                <th className="pb-4 font-bold text-text-muted">Pelanggan</th>
                <th className="pb-4 font-bold text-text-muted">Status Bayar</th>
                <th className="pb-4 font-bold text-text-muted">Status Order</th>
                <th className="pb-4 font-bold text-text-muted text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Belum ada transaksi di database.
                  </td>
                </tr>
              ) : (
                transactions.map(item => (
                  <tr key={item.id} className="border-b border-text-muted/10 last:border-0 hover:bg-white/10 transition-colors">
                    <td className="py-4 font-bold text-text-main">
                      {item.invoice_number}
                    </td>
                    <td className="py-4 text-text-muted">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 text-text-main font-bold">
                      {item.customer_name || 'Umum'}
                    </td>
                    <td className="py-4">
                      {item.payment_status === 'PAID' && <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-emerald-500">Lunas</span>}
                      {item.payment_status === 'DP' && <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-amber-500">DP</span>}
                      {item.payment_status === 'UNPAID' && <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-red-500">Belum Bayar</span>}
                    </td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold skeuo-inset text-slate-600">
                        {item.order_status}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold text-brand-600">
                      Rp {Number(item.total_amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
