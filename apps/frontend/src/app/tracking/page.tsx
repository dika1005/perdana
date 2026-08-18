'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, PackageCheck, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { OrderStatus } from '../../types/transaction';

export default function JobTrackingPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.getTransactions();
      setTransactions(res.data);
    } catch (err: any) {
      console.error('Failed to load tracking data:', err);
      setError(err?.response?.data?.message || 'Gagal memuat antrian produksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const advanceStatus = async (id: number, currentStatus: OrderStatus) => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      'ANTRIAN': 'PROSES',
      'PROSES': 'SELESAI',
      'SELESAI': 'DIAMBIL',
      'DIAMBIL': null
    };
    
    const nextStatus = statusFlow[currentStatus];
    if (nextStatus) {
      try {
        await transactionService.updateOrderStatus(id, nextStatus);
        setTransactions(prev => prev.map(job => job.id === id ? { ...job, order_status: nextStatus } : job));
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Gagal mengubah status antrian');
      }
    }
  };

  const Column = ({ title, status, icon: Icon, colorClass }: { title: string; status: OrderStatus; icon: React.ComponentType<{ className?: string }>; colorClass: string }) => {
    const columnJobs = transactions.filter(j => j.order_status === status);
    
    return (
      <div className="flex-1 min-w-[280px] flex flex-col skeuo bg-bg-skeuo h-[calc(100vh-180px)]">
        <div className={`p-4 border-b border-white/20 flex justify-between items-center ${colorClass}`}>
          <div className="flex items-center gap-2 font-bold">
            <Icon className="w-5 h-5" />
            {title}
          </div>
          <span className="w-6 h-6 rounded-full skeuo-inset flex items-center justify-center text-xs font-bold text-text-main">
            {columnJobs.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {columnJobs.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs">
              Kosong
            </div>
          ) : (
            columnJobs.map(job => (
              <div 
                key={job.id} 
                className="p-4 rounded-xl skeuo-button transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-text-muted bg-white/40 px-2 py-1 rounded-md">
                    {job.invoice_number}
                  </span>
                  <span className="text-xs text-text-muted">
                    Rp {Number(job.total_amount).toLocaleString('id-ID')}
                  </span>
                </div>
                <h4 className="font-bold text-text-main mb-1">{job.customer_name || 'Pelanggan Umum'}</h4>
                <p className="text-xs text-text-muted mb-4">
                  {job.estimated_done_at ? `Est. Selesai: ${job.estimated_done_at}` : `Tgl: ${new Date(job.created_at).toLocaleDateString('id-ID')}`}
                </p>
                
                <div className="flex items-center justify-between border-t border-black/5 pt-3 mt-3">
                  <span className="text-xs text-brand-600 font-bold">
                    {job.payment_status}
                  </span>
                  
                  {status !== 'DIAMBIL' && (
                    <button 
                      onClick={() => advanceStatus(job.id, job.order_status)}
                      className="w-8 h-8 rounded-lg skeuo-inset flex items-center justify-center text-brand-600 hover:text-brand-700 transition-colors"
                      title="Lanjut ke tahap berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2">Job Tracking Produksi</h1>
          <p className="text-text-muted">Pantau status pengerjaan pesanan langsung dari database.</p>
        </div>
        <button 
          onClick={fetchJobs} 
          className="flex items-center gap-2 px-4 py-2 font-bold skeuo-button text-text-main"
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

      <div className="flex gap-6 overflow-x-auto pb-4">
        <Column title="Antrian" status="ANTRIAN" icon={Clock} colorClass="text-slate-500" />
        <Column title="Proses Cetak" status="PROSES" icon={AlertCircle} colorClass="text-amber-500" />
        <Column title="Selesai / Siap" status="SELESAI" icon={CheckCircle2} colorClass="text-emerald-500" />
        <Column title="Telah Diambil" status="DIAMBIL" icon={PackageCheck} colorClass="text-brand-500" />
      </div>
    </DashboardLayout>
  );
}
