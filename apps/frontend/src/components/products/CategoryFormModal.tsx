'use client';

import React from 'react';
import { FolderTree } from 'lucide-react';
import { Category } from '../../types/category';
import { Modal, Button, Field, Input } from '../shared';

interface CategoryFormModalProps {
  isOpen: boolean;
  item: Category | null;
  name: string;
  onChangeName: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  item,
  name,
  onChangeName,
  submitting,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={item ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      icon={<FolderTree className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
          </Button>
        </>
      }
    >
      <Field label="Nama Kategori" required>
        <Input
          type="text"
          required
          value={name}
          onChange={e => onChangeName(e.target.value)}
          placeholder="Contoh: Spanduk & Banner"
        />
      </Field>
    </Modal>
  );
};
