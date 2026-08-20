'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  PackageCheck, 
  RefreshCw, 
  CreditCard, 
  X, 
  Check,
  MessageSquare,
  Phone,
  ExternalLink
} from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { OrderStatus } from '../../types/transaction';
import { Customer } from '../../types/customer';

export default function JobTrackingPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Pelunasan DP Instan
  const [settleModal, setSettleModal] = useState<{ open: boolean; job?: any | null }>({ open: false });
  const [payAmount, setPayAmount] = useState(0);
  const [submittingSettle, setSubmittingSettle] = useState(false);

  // Modal WhatsApp
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
      // 1. Lunasi tagihan
      if (payAmount > 0) {
        await transactionService.updatePayment(settleModal.job.id, payAmount, 'PAID');
      }
      // 2. Ubah order status ke DIAMBIL
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

    // If no phone is provided, open prompt modal
    if (!targetPhone.trim()) {
      setWaModal({ open: true, job, phone: '' });
      return;
    }

    // Format phone: 08123456789 -> 628123456789
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

  const Column = ({ title, status, icon: Icon, colorClass }: { title: string; status: OrderStatus; icon: React.ComponentType<{ className?: string }>; colorClass: string }) => {
    const columnJobs = transactions.filter(j => j.order_status === status);
    
    return (
      <div className="flex-1 min-w-[300px] flex flex-col skeuo bg-bg-skeuo h-[calc(100vh-180px)]">
        <div className={`p-4 border-b border-white/20 flex justify-between items-center ${colorClass}`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <Icon className="w-4 h-4" />
            {title}
          </div>
          <span className="w-6 h-6 rounded-full skeuo-inset flex items-center justify-center text-xs font-bold text-text-main">
            {columnJobs.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
          {columnJobs.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs">
              Kosong
            </div>
          ) : (
            columnJobs.map(job => {
              const isDP = job.payment_status === 'DP' || job.payment_status === 'UNPAID';
              const remaining = Number(job.total_amount) - Number(job.pay_amount);
              const cust = customers.find(c => c.id === job.customer_id);

              return (
                <div 
                  key={job.id} 
                  className="p-4 rounded-xl skeuo-button transition-all text-xs"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-mono font-bold text-text-muted bg-white/40 dark:bg-black/20 px-2 py-0.5 rounded">
                      {job.invoice_number}
                    </span>
                    <span className="text-[11px] font-bold text-brand-600">
                      Rp {Number(job.total_amount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-text-main text-sm">{job.customer_name || 'Pelanggan Umum'}</h4>
                    {cust?.phone && (
                      <span className="text-[10px] text-text-muted font-mono">{cust.phone}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-text-muted mb-3">
                    {job.estimated_done_at ? `Est. Selesai: ${job.estimated_done_at}` : `Tgl: ${new Date(job.created_at).toLocaleDateString('id-ID')}`}
                  </p>
                  
                  {/* Action Bar */}
                  <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2.5 mt-2">
                    <span className={`font-bold text-[11px] ${job.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {job.payment_status === 'PAID' ? 'LUNAS' : `DP (Sisa Rp ${remaining.toLocaleString('id-ID')})`}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Trigger Button on SELESAI */}
                      {status === 'SELESAI' && (
                        <button
                          onClick={() => handleSendWhatsApp(job)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
                          title="Kirim pesan WhatsApp: Pesanan sudah selesai & siap diambil"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </button>
                      )}

                      {status === 'SELESAI' && isDP && (
                        <button
                          onClick={() => handleOpenSettle(job)}
                          className="px-2.5 py-1 text-[11px] font-bold skeuo-button text-amber-600 flex items-center gap-1"
                          title="Lunasi & Serahkan Barang"
                        >
                          <CreditCard className="w-3 h-3" />
                          Lunasi & Serahkan
                        </button>
                      )}

                      {status !== 'DIAMBIL' && (!isDP || status !== 'SELESAI') && (
                        <button 
                          onClick={() => advanceStatus(job.id, job.order_status)}
                          className="w-7 h-7 rounded-lg skeuo-inset flex items-center justify-center text-brand-600 hover:text-brand-700 transition-colors"
                          title="Lanjut ke tahap berikutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
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

      <div className="flex gap-4 overflow-x-auto pb-4">
        <Column title="Antrian" status="ANTRIAN" icon={Clock} colorClass="text-slate-500" />
        <Column title="Proses Cetak" status="PROSES" icon={AlertCircle} colorClass="text-amber-500" />
        <Column title="Selesai / Siap Ambil" status="SELESAI" icon={CheckCircle2} colorClass="text-emerald-500" />
        <Column title="Telah Diambil" status="DIAMBIL" icon={PackageCheck} colorClass="text-brand-500" />
      </div>

      {/* Modal WhatsApp Phone Input Fallback */}
      {waModal.open && waModal.job && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 sm:p-7 w-full max-w-sm bg-bg-skeuo">
            <div className="flex justify-between items-start mb-4 pb-2 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-main">Kirim Notifikasi WhatsApp</h3>
                  <p className="text-[10px] text-text-muted font-mono">{waModal.job.invoice_number}</p>
                </div>
              </div>
              <button onClick={() => setWaModal({ open: false, phone: '' })} className="text-text-muted hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-text-muted">
                Pesanan atas nama <strong>{waModal.job.customer_name || 'Pelanggan'}</strong> belum memiliki nomor telepon. Masukkan nomor WhatsApp tujuan:
              </p>

              <div>
                <label className="block text-[11px] font-bold text-text-main mb-1">
                  Nomor WhatsApp Pelanggan:
                </label>
                <div className="flex items-center gap-2 px-3 py-2 skeuo-inset rounded-xl">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={waModal.phone}
                    onChange={e => setWaModal({ ...waModal, phone: e.target.value })}
                    className="bg-transparent border-none outline-none w-full text-xs text-text-main font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWaModal({ open: false, phone: '' })}
                  className="flex-1 py-2 font-bold skeuo-button text-text-muted text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!waModal.phone.trim()}
                  onClick={() => handleSendWhatsApp(waModal.job, waModal.phone)}
                  className="flex-1 py-2 font-bold bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pelunasan DP Instan */}
      {settleModal.open && settleModal.job && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSettleAndRelease} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-main">Pelunasan & Serahkan Pesanan</h2>
                <p className="text-xs text-text-muted">{settleModal.job.invoice_number} • {settleModal.job.customer_name}</p>
              </div>
              <button type="button" onClick={() => setSettleModal({ open: false })} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl skeuo-inset bg-brand-50/40 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between text-text-muted">
                <span>Total Belanja:</span>
                <span className="font-bold">Rp {Number(settleModal.job.total_amount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Telah Dibayar (DP):</span>
                <span className="font-bold">Rp {Number(settleModal.job.pay_amount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-red-500 font-bold text-sm pt-2 border-t border-black/5">
                <span>Sisa Tagihan:</span>
                <span>Rp {(Number(settleModal.job.total_amount) - Number(settleModal.job.pay_amount)).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nominal Pelunasan Diterima (Rp) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl font-bold text-base"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSettleModal({ open: false })}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingSettle}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {submittingSettle ? 'Menyimpan...' : 'Lunasi & Serahkan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
