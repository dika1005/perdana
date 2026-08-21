'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Clock, AlertCircle, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';
import { formatRupiah } from '../../utils/format';
import { useAlert } from '../../context/AlertContext';

// Modular Tracking Components
import { TrackingColumn } from '../../components/tracking/TrackingColumn';
import { TrackingSettleModal } from '../../components/tracking/TrackingSettleModal';
import { TrackingWhatsAppModal } from '../../components/tracking/TrackingWhatsAppModal';

export default function JobTrackingPage() {
  const { showAlert, showToast } = useAlert();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [settleModal, setSettleModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [payAmount, setPayAmount] = useState<number>(0);
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [waModal, setWaModal] = useState<{ open: boolean; job: any | null; phone: string }>({ open: false, job: null, phone: '' });

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.getTransactions({ per_page: 100 });
      setTransactions(res.data);
    } catch (err: any) {
      console.error('Failed to load tracking data:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data antrian produksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    customerService.getCustomers().then(res => setCustomers(res.data)).catch(() => {});
  }, []);

  const handleAdvanceStatus = async (id: number, currentStatus: OrderStatus) => {
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
        showToast(`Status pesanan diperbarui ke ${nextStatus}`, 'success');
        fetchJobs();
      } catch (err: any) {
        console.error('Failed to update status:', err);
        await showAlert({
          title: 'Gagal Mengubah Status',
          message: err?.response?.data?.message || 'Terjadi kesalahan saat memperbarui status pesanan.',
          type: 'error',
        });
      }
    }
  };

  const handleOpenSettle = (job: any) => {
    const remaining = Number(job.total_amount) - Number(job.pay_amount);
    setPayAmount(remaining);
    setSettleModal({ open: true, job });
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.job) return;

    setSubmittingSettle(true);
    try {
      await transactionService.updatePayment(settleModal.job.id, payAmount, 'PAID');
      await transactionService.updateOrderStatus(settleModal.job.id, 'DIAMBIL');
      setSettleModal({ open: false, job: null });
      showToast('Pelunasan berhasil dan barang diserahkan!', 'success');
      fetchJobs();
    } catch (err: any) {
      console.error('Failed to settle payment:', err);
      await showAlert({
        title: 'Gagal Memproses Pelunasan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat memproses pelunasan pesanan.',
        type: 'error',
      });
    } finally {
      setSubmittingSettle(false);
    }
  };

  const handleSendWhatsApp = (job: any) => {
    const cust = customers.find(c => c.id === job.customer_id);
    const initialPhone = cust?.phone || '';
    setWaModal({ open: true, job, phone: initialPhone });
  };

  const handleSendWhatsAppSubmit = async () => {
    if (!waModal.job) return;

    let targetPhone = waModal.phone.replace(/[^0-9]/g, '');
    if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.slice(1);
    }

    if (!targetPhone) {
      await showAlert({
        title: 'Nomor WhatsApp Tidak Valid',
        message: 'Silakan masukkan nomor WhatsApp tujuan yang valid (contoh: 081234567890).',
        type: 'warning',
      });
      return;
    }

    const remaining = Number(waModal.job.total_amount) - Number(waModal.job.pay_amount);
    const paymentNote = waModal.job.payment_status === 'PAID'
      ? '✅ *Status: LUNAS*'
      : `⚠️ *Sisa Pembayaran: ${formatRupiah(remaining)}*`;

    const message = 
`Halo Kak *${waModal.job.customer_name || 'Pelanggan'}*,
Pesanan Anda di *Perdana POS Percetakan* sudah selesai diproses dan siap diambil! 📦✨

📄 *No. Nota:* ${waModal.job.invoice_number}
💰 *Total:* ${formatRupiah(waModal.job.total_amount)}
${paymentNote}

Silakan datang ke toko kami untuk pengambilan barang. Terima kasih! 🙏`;

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setWaModal({ open: false, job: null, phone: '' });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-1">Antrian & Status Pesanan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Pantau pesanan dari antrian produksi hingga siap diambil pelanggan.</p>
        </div>
        <button 
          onClick={fetchJobs} 
          className="flex items-center gap-2 px-3.5 py-2 font-semibold skeuo-button text-text-main text-xs rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <TrackingColumn
          title="Antrian Cetak"
          status="ANTRIAN"
          icon={Clock}
          colorClass="text-slate-700 dark:text-slate-300"
          bgClass="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
        />
        <TrackingColumn
          title="Sedang Diproses"
          status="PROSES"
          icon={AlertCircle}
          colorClass="text-blue-700 dark:text-blue-300"
          bgClass="bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
        />
        <TrackingColumn
          title="Selesai — Siap Ambil"
          status="SELESAI"
          icon={CheckCircle2}
          colorClass="text-purple-700 dark:text-purple-300"
          bgClass="bg-purple-50/70 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/50"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
        />
        <TrackingColumn
          title="Sudah Diambil"
          status="DIAMBIL"
          icon={PackageCheck}
          colorClass="text-emerald-700 dark:text-emerald-300"
          bgClass="bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
        />
      </div>

      {/* Settle Modal */}
      <TrackingSettleModal
        isOpen={settleModal.open}
        job={settleModal.job}
        payAmount={payAmount}
        onPayAmountChange={setPayAmount}
        submitting={submittingSettle}
        onClose={() => setSettleModal({ open: false, job: null })}
        onSubmit={handleSettleSubmit}
      />

      {/* WhatsApp Modal */}
      <TrackingWhatsAppModal
        isOpen={waModal.open}
        job={waModal.job}
        phone={waModal.phone}
        onPhoneChange={(phone) => setWaModal(prev => ({ ...prev, phone }))}
        onClose={() => setWaModal({ open: false, job: null, phone: '' })}
        onSubmit={handleSendWhatsAppSubmit}
      />
    </DashboardLayout>
  );
}
