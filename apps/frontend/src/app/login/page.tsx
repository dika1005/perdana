'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, RefreshCw, Eye, EyeOff, ArrowLeft, Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

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
    <div className="min-h-screen relative flex flex-col justify-between bg-bg-skeuo text-text-main font-sans overflow-hidden">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/[0.04] dark:bg-purple-500/[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Back to Home + Theme Switcher */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between relative z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl skeuo-button text-xs font-bold text-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl skeuo-button flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
          title="Ganti Tema (Dark / Light)"
        >
          {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>
      </header>

      {/* Main Login Card Center */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md p-8 sm:p-10 skeuo rounded-3xl relative shadow-2xl border border-black/[0.06] dark:border-white/[0.08]">
          
          {/* Brand & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-blue-500/25">
              P
            </div>
            <h1 className="text-2xl font-black text-text-main tracking-tight">Perdana POS & Percetakan</h1>
            <p className="text-xs text-text-muted mt-1 font-medium">Portal Masuk Khusus Kasir & Owner</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 mt-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sistem Kasir Terenkripsi & Aman</span>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full py-4 text-center text-[10px] text-text-muted relative z-10">
        © {new Date().getFullYear()} Perdana Printing & POS. Semua hak cipta dilindungi.
      </footer>

    </div>
  );
}
