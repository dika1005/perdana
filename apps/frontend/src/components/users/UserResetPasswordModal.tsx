'use client';

import React from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { User } from '../../types/user';
import { Modal, Button, Field } from '../shared';

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
  if (!user) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Reset Password Kasir"
      subtitle={<>Masukkan password baru untuk akun <strong className="text-text-main">{user.name}</strong> ({user.username}).</>}
      icon={<KeyRound className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Memproses...' : 'Ubah Password'}
          </Button>
        </>
      }
    >
      <Field label="Password Baru (Min. 8 Karakter)" required>
        <div className="flex items-center gap-2 px-3.5 py-2.5 skeuo-inset rounded-xl focus-within:border-brand-500 transition-colors">
          <Lock className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="password"
            required
            value={newPassword}
            onChange={e => onChangePassword(e.target.value)}
            placeholder="Masukkan password baru..."
            className="w-full bg-transparent outline-none text-text-main text-sm"
          />
        </div>
      </Field>
    </Modal>
  );
};
