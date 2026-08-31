'use client';

import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Customer } from '../../types/customer';
import { Modal, Button, Field, Input, Textarea } from '../shared';

interface CustomerFormModalProps {
  isOpen: boolean;
  editingCustomer: Customer | null;
  name: string;
  onChangeName: (val: string) => void;
  phone: string;
  onChangePhone: (val: string) => void;
  address: string;
  onChangeAddress: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  editingCustomer,
  name,
  onChangeName,
  phone,
  onChangePhone,
  address,
  onChangeAddress,
  submitting,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!editingCustomer;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
      subtitle={isEdit ? 'Perbarui informasi kontak dan alamat pelanggan.' : 'Simpan identitas pelanggan untuk nota & repeat order.'}
      icon={isEdit ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Pelanggan')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama Pelanggan / Perusahaan" required>
          <Input
            type="text"
            required
            value={name}
            onChange={e => onChangeName(e.target.value)}
            placeholder="Contoh: PT. Maju Jaya / Budi Santoso"
          />
        </Field>

        <Field label="Nomor WhatsApp / Telepon">
          <Input
            type="tel"
            value={phone}
            onChange={e => onChangePhone(e.target.value)}
            placeholder="Contoh: 081234567890"
          />
        </Field>

        <Field label="Alamat Lengkap / Keterangan">
          <Textarea
            value={address}
            onChange={e => onChangeAddress(e.target.value)}
            placeholder="Contoh: Jl. Merdeka No. 123, Blok B"
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
};
