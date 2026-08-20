'use client';

import React from 'react';
import { Lock, X } from 'lucide-react';
import { User } from '../../types/user';

interface UserResetPasswordModalProps {
  isOpen: boolean;
  user: User | null;
  newPassword: string;
  onChangePassword: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserResetPasswordModal: React.FC<UserResetPasswordModalProps> = ({
  isOpen,
  user,
  newPassword,
  onChangePassword,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-text-main">Reset Password Kasir</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-text-muted mb-4">
          Masukkan password baru untuk akun <strong>{user.name}</strong> ({user.username}).
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Password Baru (Min. 8 Karakter) *</label>
            <div className="flex items-center gap-2 px-4 py-2.5 skeuo-inset rounded-xl">
              <Lock className="w-4 h-4 text-text-muted" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => onChangePassword(e.target.value)}
                placeholder="Masukkan password baru..."
                className="w-full bg-transparent outline-none text-text-main text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-sm rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-sm rounded-xl"
          >
            {submitting ? 'Memproses...' : 'Ubah Password'}
          </button>
        </div>
      </form>
    </div>
  );
};
