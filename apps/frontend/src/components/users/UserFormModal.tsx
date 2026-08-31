'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { UserRole } from '../../types/user';
import { Modal, Button, Field, Input, Select } from '../shared';

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
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Tambah Akun Kasir Baru"
      icon={<UserPlus className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : 'Simpan Akun'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama Lengkap" required>
          <Input
            type="text"
            required
            value={formData.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="Contoh: Ahmad Kasir"
          />
        </Field>

        <Field label="Username Login" required>
          <Input
            type="text"
            required
            value={formData.username}
            onChange={e => onChange('username', e.target.value)}
            placeholder="Contoh: ahmad12"
          />
        </Field>

        <Field label="Password Awal (Min. 8 Karakter)" required>
          <Input
            type="password"
            required
            value={formData.password}
            onChange={e => onChange('password', e.target.value)}
            placeholder="Minimal 8 karakter"
          />
        </Field>

        <Field label="Role / Hak Akses">
          <Select
            value={formData.role}
            onChange={e => onChange('role', e.target.value as UserRole)}
          >
            <option value="ADMIN">ADMIN (Kasir & Operator)</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
};
