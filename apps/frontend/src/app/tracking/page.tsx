'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Clock, AlertCircle, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { OrderStatus, PaymentMethod } from '../../types/transaction';
import { Customer } from '../../types/customer';
import { createWaLink } from '../../utils/whatsapp';
import { useAlert } from '../../context/AlertContext';
import { PageHeader, Button, ErrorBanner } from '../../components/shared';

// Modular Tracking Components
import { TrackingColumn } from '../../components/tracking/TrackingColumn';
import { TrackingSettleModal } from '../../components/tracking/TrackingSettleModal';
import { TrackingWhatsAppModal, generateWhatsAppMessage } from '../../components/tracking/TrackingWhatsAppModal';
import { TrackingDetailModal } from '../../components/tracking/TrackingDetailModal';
import { JobTicketModal } from '../../components/tracking/JobTicketModal';
import { CancelTransactionModal } from '../../components/transactions/CancelTransactionModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';

export default function JobTrackingPage() {
  const { showAlert, showToast } = useAlert();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [settleModal, setSettleModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<PaymentMethod>('CASH');
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [waModal, setWaModal] = useState<{ open: boolean; job: any | null; phone: string }>({ open: false, job: null, phone: '' });
  const [spkModal, setSpkModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [detailModal, setDetailModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; invoiceData: any | null }>({ open: false, invoiceData: null });
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, custRes] = await Promise.all([
        transactionService.getTransactions({ per_page: 100 }),
        customerService.getCustomers(),
      ]);
      setTransactions(res.data);
      setCustomers(custRes.data);
    } catch (err: any) {
      console.error('Failed to load tracking data:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data antrian produksi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAdvanceStatus = async (id: number, currentStatus: OrderStatus) => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      'ANTRIAN': 'PROSES',
      'PROSES': 'SELESAI',
      'SELESAI': 'DIAMBIL',
      'DIAMBIL': null,
      'BATAL': null
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
    setSettlePaymentMethod('CASH');
    setSettleModal({ open: true, job });
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.job) return;

    setSubmittingSettle(true);
    try {
      await transactionService.settle(settleModal.job.id, settlePaymentMethod);
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

  const handleSendWhatsApp = async (job: any) => {
    const cust = customers.find(c => c.id === job.customer_id);
    const phone = cust?.phone || job.customer_phone || '';
    let fullJob = job;
    if (!job.items || job.items.length === 0) {
      try {
        const fetched = await transactionService.getTransactionById(job.id);
        if (fetched) fullJob = fetched;
      } catch (e) {
        console.error('Failed to load transaction items for WA:', e);
      }
    }
    setWaModal({ open: true, job: fullJob, phone });
  };

  const handleSendWhatsAppSubmit = () => {
    if (!waModal.job) return;

    const message = generateWhatsAppMessage(waModal.job);
    const url = createWaLink(waModal.phone, message);
    window.open(url, '_blank');
    setWaModal({ open: false, job: null, phone: '' });
  };

  const handlePrintSpk = async (job: any) => {
    try {
      const fullJob = await transactionService.getTransactionById(job.id);
      setSpkModal({ open: true, job: fullJob || job });
    } catch {
      setSpkModal({ open: true, job });
    }
  };

  const handleOpenDetail = async (job: any) => {
    try {
      const fullJob = await transactionService.getTransactionById(job.id);
      setDetailModal({ open: true, job: fullJob || job });
    } catch {
      setDetailModal({ open: true, job });
    }
  };

  const handlePrintReceipt = async (job: any) => {
    try {
      const invoice = await transactionService.getInvoiceData(job.id);
      setReceiptModal({ open: true, invoiceData: invoice });
    } catch {
      setReceiptModal({ open: true, invoiceData: job });
    }
  };

  const handleSubmitCancel = async (reason: string) => {
    if (!cancelTarget?.id) return;
    setSubmittingCancel(true);
    try {
      await transactionService.cancelTransaction(cancelTarget.id, reason);
      const paid = Number(cancelTarget.pay_amount ?? cancelTarget.paid_amount) || 0;
      showToast(
        paid > 0
          ? 'Pesanan dibatalkan; uang pelanggan menunggu refund via Riwayat Transaksi'
          : 'Pesanan dibatalkan; reservasi bahan dilepas',
        'success'
      );
      setCancelTarget(null);
      fetchJobs();
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      await showAlert({
        title: 'Gagal Membatalkan Pesanan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat membatalkan pesanan.',
        type: 'error',
      });
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Antrian & Pelacakan Produksi"
        subtitle="Pantau status pengerjaan pesanan cetak dan cetak SPK untuk operator produksi."
        actions={
          <Button variant="secondary" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Antrian
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchJobs} />}

      {/* Kanban Board 4 Kolom */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <TrackingColumn
          title="Antrian Cetak"
          status="ANTRIAN"
          icon={AlertCircle}
          colorClass="text-amber-700 dark:text-amber-300"
          bgClass="bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/50"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
          onPrintSpk={handlePrintSpk}
          onOpenDetail={handleOpenDetail}
          onCancel={setCancelTarget}
        />
        
        <TrackingColumn
          title="Sedang Dikerjakan"
          status="PROSES"
          icon={Clock}
          colorClass="text-blue-700 dark:text-blue-300"
          bgClass="bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50"
          transactions={transactions}
          customers={customers}
          onOpenSettle={handleOpenSettle}
          onSendWhatsApp={handleSendWhatsApp}
          onAdvanceStatus={handleAdvanceStatus}
          onPrintSpk={handlePrintSpk}
          onOpenDetail={handleOpenDetail}
        />

        <TrackingColumn
          title="Siap Diambil"
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
          onOpenDetail={handleOpenDetail}
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
          onOpenDetail={handleOpenDetail}
        />
      </div>

      {/* Settle Modal */}
      <TrackingSettleModal
        isOpen={settleModal.open}
        job={settleModal.job}
        paymentMethod={settlePaymentMethod}
        onPaymentMethodChange={setSettlePaymentMethod}
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

      {/* SPK / Tiket Kerja Operator Modal */}
      <JobTicketModal
        isOpen={spkModal.open}
        job={spkModal.job}
        customers={customers}
        onClose={() => setSpkModal({ open: false, job: null })}
      />

      {/* Detail Pesanan & Cek Nota Modal */}
      <TrackingDetailModal
        isOpen={detailModal.open}
        job={detailModal.job}
        customers={customers}
        onClose={() => setDetailModal({ open: false, job: null })}
        onPrintSpk={handlePrintSpk}
        onPrintReceipt={handlePrintReceipt}
        onOpenSettle={handleOpenSettle}
      />

      {/* Struk / Nota Kasir Modal */}
      {receiptModal.open && receiptModal.invoiceData && (
        <ReceiptModal
          invoiceData={receiptModal.invoiceData}
          onClose={() => setReceiptModal({ open: false, invoiceData: null })}
        />
      )}

      {/* Cancel Modal (khusus pesanan masih ANTRIAN) */}
      {cancelTarget && (
        <CancelTransactionModal
          key={cancelTarget.id}
          transaction={cancelTarget}
          submitting={submittingCancel}
          onClose={() => setCancelTarget(null)}
          onSubmit={handleSubmitCancel}
        />
      )}
    </DashboardLayout>
  );
}
