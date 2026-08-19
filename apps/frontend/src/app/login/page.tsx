'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';

export default function LoginPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-bg-skeuo px-4">
      <div className="w-full max-w-md p-8 skeuo">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full skeuo mx-auto flex items-center justify-center text-brand-500 font-bold text-3xl mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-text-main">Perdana POS</h1>
          <p className="text-text-muted mt-2">Silakan masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl skeuo-inset bg-red-50/50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Username</label>
            <div className="flex items-center gap-3 px-4 py-3 skeuo-inset">
              <User className="w-5 h-5 text-text-muted" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username" 
                className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
            <div className="flex items-center gap-3 px-4 py-3 skeuo-inset">
              <Lock className="w-5 h-5 text-text-muted" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password" 
                className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-muted hover:text-text-main transition-colors p-1"
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 skeuo-button font-bold text-brand-600 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
