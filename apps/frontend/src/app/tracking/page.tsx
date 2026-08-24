'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Clock, AlertCircle, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';
import { formatRupiah } from '../../utils/format';
import { createWaLink } from '../../utils/whatsapp';
import { useAlert } from '../../context/AlertContext';

// Modular Tracking Components
import { TrackingColumn } from '../../components/tracking/TrackingColumn';
import { TrackingSettleModal } from '../../components/tracking/TrackingSettleModal';
import { TrackingWhatsAppModal } from '../../components/tracking/TrackingWhatsAppModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';

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
  const [printModal, setPrintModal] = useState<{ open: boolean; invoiceData: any | null }>({ open: false, invoiceData: null });

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
    const phone = cust?.phone || '';
    setWaModal({ open: true, job, phone });
  };

  const handleSendWhatsAppSubmit = () => {
    if (!waModal.job) return;

    const message = `Halo Kak ${waModal.job.customer_name || 'Pelanggan'},\n\nPesanan percetakan Anda dengan nomor nota *${waModal.job.invoice_number}* sudah *SELESAI DIKERJAKAN* dan siap diambil di toko Perdana Percetakan.\n\nTotal: ${formatRupiah(waModal.job.total_amount)}\nStatus: ${waModal.job.payment_status === 'PAID' ? 'LUNAS' : `Sisa Tagihan ${formatRupiah(Number(waModal.job.total_amount) - Number(waModal.job.pay_amount))}`}\n\nTerima kasih!`;

    const url = createWaLink(waModal.phone, message);
    window.open(url, '_blank');
    setWaModal({ open: false, job: null, phone: '' });
  };

  const handlePrintSpk = async (job: any) => {
    try {
      const invoice = await transactionService.getInvoiceData(job.id);
      setPrintModal({ open: true, invoiceData: invoice });
    } catch (err: any) {
      console.error('Failed to load invoice for SPK:', err);
      showToast('Gagal memuat data struk/SPK', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-1">Kanban Antrian Produksi & Tracking</h1>
          <p className="text-text-muted text-xs sm:text-sm">Pantau proses cetak, cetak tiket SPK kerja, notifikasi WhatsApp, dan serah terima pesanan.</p>
        </div>
        <button 
          onClick={fetchJobs} 
          className="flex items-center gap-2 px-4 py-2 font-bold skeuo-button text-text-main text-xs sm:text-sm rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Antrian</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <TrackingColumn
          title="Antrian Cetak"
          status="ANTRIAN"
          icon={Clock}
          colorClass="text-amber-700 dark:text-amber-300"
          bgClass="bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/50"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
          onPrintSpk={handlePrintSpk}
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
          onPrintSpk={handlePrintSpk}
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
          onPrintSpk={handlePrintSpk}
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
          onPrintSpk={handlePrintSpk}
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

      {/* SPK / Receipt Print Modal */}
      {printModal.open && printModal.invoiceData && (
        <ReceiptModal
          invoiceData={printModal.invoiceData}
          onClose={() => setPrintModal({ open: false, invoiceData: null })}
          onPrint={() => window.print()}
        />
      )}
    </DashboardLayout>
  );
}
