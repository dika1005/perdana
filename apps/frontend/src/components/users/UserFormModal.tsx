'use client';

import React from 'react';
import { X } from 'lucide-react';
import { UserRole } from '../../types/user';

interface UserFormData {
  name: string;
  username: string;
  password: string;
  role: UserRole;
}

interface UserFormModalProps {
  isOpen: boolean;
  formData: UserFormData;
  onChange: (field: keyof UserFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  formData,
  onChange,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={onSubmit} className="skeuo p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-text-main">Tambah Akun Kasir Baru</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="Contoh: Ahmad Kasir"
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Username Login *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => onChange('username', e.target.value)}
              placeholder="Contoh: ahmad12"
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Password Awal (Min. 8 Karakter) *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => onChange('password', e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-2.5 skeuo-inset outline-none text-text-main rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Role / Hak Akses</label>
            <select
              value={formData.role}
              onChange={e => onChange('role', e.target.value as UserRole)}
              className="w-full px-4 py-2.5 skeuo outline-none text-text-main rounded-xl bg-transparent font-medium text-sm"
            >
              <option value="ADMIN">ADMIN (Kasir & Operator)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
            </select>
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
            {submitting ? 'Menyimpan...' : 'Simpan Akun'}
          </button>
        </div>
      </form>
    </div>
  );
};
