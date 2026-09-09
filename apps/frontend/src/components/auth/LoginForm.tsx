'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button, ErrorBanner } from '../shared';

/** Kartu login lengkap: brand, form username/password, dan catatan keamanan. */
export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login(username.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err?.response?.data?.message ||
        'Login gagal. Periksa koneksi backend dan kecocokan username/password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Brand & Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-blue-500/25">
          P
        </div>
        <h1 className="text-2xl font-black text-text-main tracking-tight">Perdana POS & Percetakan</h1>
        <p className="text-xs text-text-muted mt-1 font-medium">Portal Masuk Khusus Kasir & Owner</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Username</label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl skeuo-inset">
            <User className="w-4 h-4 text-text-muted shrink-0" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-medium text-text-main placeholder:text-text-muted/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Password</label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl skeuo-inset">
            <Lock className="w-4 h-4 text-text-muted shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-medium text-text-main placeholder:text-text-muted/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-main transition-colors p-1"
              title={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button variant="primary" type="submit" disabled={loading} className="w-full mt-3">
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
        </Button>
      </form>

      {/* Security Notice */}
      <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Sistem Kasir Terenkripsi & Aman</span>
      </div>
    </>
  );
};