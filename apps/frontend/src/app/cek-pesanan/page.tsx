'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowLeft, 
  Printer, 
  Clock, 
  CheckCircle2, 
  PackageCheck, 
  AlertCircle, 
  Layers, 
  MessageSquare, 
  CreditCard,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  Phone
} from 'lucide-react';
import { publicService, PublicTrackingData } from '../../services/publicService';
import { formatRupiah } from '../../utils/format';

export default function CekPesananPage() {
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<PublicTrackingData | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Sync theme
  useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // URL Query param auto-search
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inv = params.get('invoice');
      const phone = params.get('phone');
      if (inv) {
        setQueryInput(inv);
        performSearch(inv);
      } else if (phone) {
        setQueryInput(phone);
        performSearch(phone);
      }
    }
  }, []);

  const performSearch = async (val: string) => {
    const clean = val.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    try {
      const isPhone = /^[0-9+]+$/.test(clean);
      const data = await publicService.getTracking(
        isPhone ? { phone: clean } : { invoice: clean }
      );
      setTrackingData(data);
    } catch (err: any) {
      setTrackingData(null);
      setError(
        err?.response?.data?.message ||
        'Pesanan tidak ditemukan. Mohon periksa kembali Nomor Nota atau No. WhatsApp Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(queryInput);
  };

  // Step calculations
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'ANTRIAN': return 0;
      case 'PROSES': return 1;
      case 'SELESAI': return 2;
      case 'DIAMBIL': return 3;
      default: return 0;
    }
  };

  const currentStep = trackingData ? getStepIndex(trackingData.order_status) : 0;

  const steps = [
    { label: 'Antrian Desain / Cetak', desc: 'Pesanan masuk ke antrian produksi', icon: Clock },
    { label: 'Sedang Dicetak', desc: 'Mesin sedang memproses pesanan Anda', icon: Printer },
    { label: 'Selesai — Siap Diambil', desc: 'Barang sudah jadi di outlet kami', icon: Sparkles },
    { label: 'Sudah Diambil', desc: 'Barang telah diserahkan ke pelanggan', icon: PackageCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
              <Printer className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white hidden sm:inline">
              PERDANA PRINTING
            </span>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-xl skeuo-button text-slate-600 dark:text-slate-300 hover:text-slate-900"
            title="Ganti Tema"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-bold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Live Order Tracking
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pantau Status & Antrian Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Masukkan Nomor Nota (Invoice) atau Nomor WhatsApp yang Anda gunakan saat pemesanan.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="mb-8">
          <div className="p-2 rounded-2xl skeuo bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-2 shadow-md">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
                placeholder="Contoh: INV-20260821-1234 atau 081234567890"
                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-7 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-xs tracking-wide shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Mencari...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Cek Status</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-3 mb-6 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Pesanan Tidak Ditemukan</p>
              <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          </div>
        )}

        {/* Result Card & Progress Stepper */}
        {trackingData && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Order Card Summary */}
            <div className="p-6 rounded-2xl skeuo bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                trackingData.order_status === 'DIAMBIL' ? 'bg-emerald-500' :
                trackingData.order_status === 'SELESAI' ? 'bg-purple-500' :
                trackingData.order_status === 'PROSES' ? 'bg-blue-500' :
                'bg-amber-500'
              }`} />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No. Nota Transaksi</span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {trackingData.invoice_number}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Atas Nama: <strong className="text-slate-800 dark:text-slate-200">{trackingData.customer_name}</strong> • {new Date(trackingData.created_at).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border shadow-xs ${
                    trackingData.payment_status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {trackingData.payment_status === 'PAID' ? 'LUNAS' : 'DP (Belum Lunas)'}
                  </span>
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div className="py-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Progres Pengerjaan</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {steps.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const StepIcon = step.icon;

                    return (
                      <div key={idx} className={`p-4 rounded-xl border transition-all ${
                        isCurrent 
                          ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 shadow-md ring-2 ring-brand-500/20' 
                          : isDone 
                          ? 'bg-slate-50/80 dark:bg-slate-900/60 border-emerald-400/60 dark:border-emerald-600/60'
                          : 'bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-50'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrent 
                              ? 'bg-brand-600 text-white shadow-sm' 
                              : isDone 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}>
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-bold leading-tight ${
                            isCurrent ? 'text-brand-600 dark:text-brand-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items Detail */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Item Pesanan</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {trackingData.items.map((item, i) => (
                    <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}
                        </p>
                        {item.addons.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Finishing: {item.addons.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {item.qty} qty
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Pickup Note */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Tagihan:</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatRupiah(trackingData.total_amount)}
                  </span>
                  {Number(trackingData.remaining_amount) > 0 && (
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      Sisa Pembayaran: {formatRupiah(trackingData.remaining_amount)}
                    </p>
                  )}
                </div>

                <a
                  href={`https://wa.me/${(trackingData.store_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Halo CS ${trackingData.store_name}, saya ingin menanyakan progres pesanan dengan No. Nota: ${trackingData.invoice_number} atas nama ${trackingData.customer_name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hubungi CS WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
