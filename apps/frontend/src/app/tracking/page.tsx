'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Clock, AlertCircle, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { OrderStatus, PaymentMethod } from '../../types/transaction';
import { Customer } from '../../types/customer';
import { formatRupiah } from '../../utils/format';
import { createWaLink } from '../../utils/whatsapp';
import { useAlert } from '../../context/AlertContext';

// Modular Tracking Components
import { RawMaterial } from '../../types/rawMaterial';
import { rawMaterialService } from '../../services/rawMaterialService';
import { TrackingColumn } from '../../components/tracking/TrackingColumn';
import { TrackingSettleModal } from '../../components/tracking/TrackingSettleModal';
import { TrackingWhatsAppModal, generateWhatsAppMessage } from '../../components/tracking/TrackingWhatsAppModal';
import { TrackingDetailModal } from '../../components/tracking/TrackingDetailModal';
import { JobTicketModal } from '../../components/tracking/JobTicketModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';

export default function JobTrackingPage() {
  const { showAlert, showToast } = useAlert();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [settleModal, setSettleModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [payAmount, setPayAmount] = useState<number>(0);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<PaymentMethod>('CASH');
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [waModal, setWaModal] = useState<{ open: boolean; job: any | null; phone: string }>({ open: false, job: null, phone: '' });
  const [spkModal, setSpkModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [detailModal, setDetailModal] = useState<{ open: boolean; job: any | null }>({ open: false, job: null });
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; invoiceData: any | null }>({ open: false, invoiceData: null });

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, custRes, matRes] = await Promise.all([
        transactionService.getTransactions({ per_page: 100 }),
        customerService.getCustomers(),
        rawMaterialService.getRawMaterials(),
      ]);
      setTransactions(res.data);
      setCustomers(custRes.data);
      setRawMaterials(matRes.data);
    } catch (err: any) {
      console.error('Failed to load tracking data:', err);
      setError(err?.response?.data?.message || 'Gagal memuat data antrian produksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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
    const remaining = Number(job.total_amount) - Number(job.pay_amount);
    setPayAmount(remaining > 0 ? remaining : 0);
    setSettlePaymentMethod('CASH');
    setSettleModal({ open: true, job });
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.job) return;

    setSubmittingSettle(true);
    try {
      await transactionService.updatePayment(settleModal.job.id, payAmount, 'PAID', settlePaymentMethod);
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
    } catch (err) {
      setSpkModal({ open: true, job });
    }
  };

  const handleOpenDetail = async (job: any) => {
    try {
      const fullJob = await transactionService.getTransactionById(job.id);
      setDetailModal({ open: true, job: fullJob || job });
    } catch (err) {
      setDetailModal({ open: true, job });
    }
  };

  const handlePrintReceipt = async (job: any) => {
    try {
      const invoice = await transactionService.getInvoiceData(job.id);
      setReceiptModal({ open: true, invoiceData: invoice });
    } catch (err) {
      setReceiptModal({ open: true, invoiceData: job });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Antrian & Pelacakan Produksi</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pantau status pengerjaan pesanan cetak dan cetak SPK untuk operator produksi.
          </p>
        </div>
        <button 
          onClick={fetchJobs} 
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold skeuo-button text-blue-600 dark:text-blue-400 hover:text-blue-700 rounded-xl self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Antrian</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50/50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchJobs} className="underline font-bold">Coba Lagi</button>
        </div>
      )}

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
        payAmount={payAmount}
        onPayAmountChange={setPayAmount}
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
    </DashboardLayout>
  );
}
