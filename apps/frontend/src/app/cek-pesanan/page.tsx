'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { publicService, PublicTrackingData } from '../../services/publicService';
import { PublicNavbar, SectionHeading, StatusAlert } from '../../components/shared';
import { CekPesananSearchForm } from '../../components/cek-pesanan/CekPesananSearchForm';
import { TrackingResultCard } from '../../components/cek-pesanan/TrackingResultCard';

export default function CekPesananPage() {
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<PublicTrackingData | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Sync theme
  useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark';
    if (isDarkStored) {
      setIsDark(true);
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

  const performSearch = async (val: string) => {
    const clean = val.trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    try {
      const data = await publicService.getTracking({
        q: clean,
        invoice: clean,
        phone: clean,
      });
      setTrackingData(data);
    } catch (err: any) {
      setTrackingData(null);
      setError(
        err?.response?.data?.message ||
        'Pesanan tidak ditemukan. Mohon periksa kembali Nomor Nota, Nama, atau No. WhatsApp Anda.'
      );
    } finally {
      setLoading(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(queryInput);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <PublicNavbar isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SectionHeading
          align="center"
          eyebrow="Live Order Tracking"
          eyebrowIcon={<Sparkles className="w-3.5 h-3.5" />}
          title="Pantau Status & Antrian Pesanan"
          description="Masukkan Nomor Nota (Invoice) atau Nomor WhatsApp yang Anda gunakan saat pemesanan."
          className="mb-8"
        />

        <CekPesananSearchForm
          queryInput={queryInput}
          onQueryChange={setQueryInput}
          onSubmit={handleSearchSubmit}
          loading={loading}
        />

        {error && (
          <StatusAlert title="Pesanan Tidak Ditemukan" className="mb-6">
            {error}
          </StatusAlert>
        )}

        {trackingData && <TrackingResultCard data={trackingData} />}
      </main>
    </div>
  );
}
