'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Clock, AlertCircle, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';

// Modular Tracking Components
import { TrackingColumn } from '../../components/tracking/TrackingColumn';
import { TrackingSettleModal } from '../../components/tracking/TrackingSettleModal';
import { TrackingWhatsAppModal } from '../../components/tracking/TrackingWhatsAppModal';

export default function JobTrackingPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [settleModal, setSettleModal] = useState<{ open: boolean; job?: any | null }>({ open: false });
  const [payAmount, setPayAmount] = useState(0);
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [waModal, setWaModal] = useState<{ open: boolean; job?: any | null; phone: string }>({ open: false, phone: '' });

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, custRes] = await Promise.all([
        transactionService.getTransactions(),
        customerService.getCustomers()
      ]);
      setTransactions(res.data);
      setCustomers(custRes.data);
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

  const handleOpenSettle = (job: any) => {
    const remaining = Number(job.total_amount) - Number(job.pay_amount);
    setSettleModal({ open: true, job });
    setPayAmount(remaining > 0 ? remaining : 0);
  };

  const handleSettleAndRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.job) return;
    setSubmittingSettle(true);
    try {
      if (payAmount > 0) {
        await transactionService.updatePayment(settleModal.job.id, payAmount, 'PAID');
      }
      await transactionService.updateOrderStatus(settleModal.job.id, 'DIAMBIL');
      
      setSettleModal({ open: false });
      alert('Pelunasan berhasil dan pesanan telah diserahkan (DIAMBIL)!');
      await fetchJobs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyelesaikan pelunasan dan penyerahan');
    } finally {
      setSubmittingSettle(false);
    }
  };

  const handleSendWhatsApp = (job: any, customPhone?: string) => {
    const cust = customers.find(c => c.id === job.customer_id);
    const targetPhone = customPhone || cust?.phone || '';

    if (!targetPhone.trim()) {
      setWaModal({ open: true, job, phone: '' });
      return;
    }

    let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    const customerName = job.customer_name || 'Pelanggan';
    const invoiceNumber = job.invoice_number;
    const remaining = Number(job.total_amount) - Number(job.pay_amount);
    const isPaid = job.payment_status === 'PAID' || remaining <= 0;
    const paymentText = isPaid ? '*LUNAS*' : `*DP (Sisa Tagihan: Rp ${remaining.toLocaleString('id-ID')})*`;

    const message = `Halo Kak *${customerName}*,\n\nKabar gembira! Pesanan cetak Anda di *PERDANA PRINTING & POS* sudah *SELESAI* dan siap diambil. 🥳🎉\n\n📋 *Rincian Pesanan:*\n• No. Nota: *${invoiceNumber}*\n• Total Belanja: *Rp ${Number(job.total_amount).toLocaleString('id-ID')}*\n• Status Bayar: ${paymentText}\n\n📍 *Lokasi Pengambilan:*\nJl. Percetakan Perdana No. 1, Kota\nBuka setiap hari jam 08.00 - 21.00 WIB\n\nSilakan tunjukkan nomor nota ini kepada kasir saat pengambilan pesanan. Terima kasih banyak telah mempercayakan cetakan Anda di tempat kami! 🙏✨`;

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setWaModal({ open: false, phone: '' });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-1">Job Tracking Produksi</h1>
          <p className="text-text-muted text-sm">Pantau status pengerjaan pesanan, notifikasi WhatsApp pelanggan, & pelunasan saat pengambilan.</p>
        </div>
        <button 
          onClick={fetchJobs} 
          className="flex items-center gap-2 px-4 py-2 font-bold skeuo-button text-text-main text-xs"
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

      {/* Kanban Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <TrackingColumn
          title="Antrian"
          status="ANTRIAN"
          icon={Clock}
          colorClass="text-slate-500"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={advanceStatus}
        />
        <TrackingColumn
          title="Proses Cetak"
          status="PROSES"
          icon={AlertCircle}
          colorClass="text-amber-500"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={advanceStatus}
        />
        <TrackingColumn
          title="Selesai / Siap Ambil"
          status="SELESAI"
          icon={CheckCircle2}
          colorClass="text-emerald-500"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={advanceStatus}
        />
        <TrackingColumn
          title="Telah Diambil"
          status="DIAMBIL"
          icon={PackageCheck}
          colorClass="text-brand-500"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={advanceStatus}
        />
      </div>

      {/* Settle Modal */}
      <TrackingSettleModal
        isOpen={settleModal.open}
        job={settleModal.job}
        payAmount={payAmount}
        onPayAmountChange={setPayAmount}
        submitting={submittingSettle}
        onClose={() => setSettleModal({ open: false })}
        onSubmit={handleSettleAndRelease}
      />

      {/* WhatsApp Modal */}
      <TrackingWhatsAppModal
        isOpen={waModal.open}
        job={waModal.job}
        phone={waModal.phone}
        onPhoneChange={val => setWaModal(prev => ({ ...prev, phone: val }))}
        onClose={() => setWaModal({ open: false, phone: '' })}
        onSubmit={() => handleSendWhatsApp(waModal.job, waModal.phone)}
      />
    </DashboardLayout>
  );
}
