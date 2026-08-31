'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { Modal, Button, Field, Input } from '../shared';

interface InventoryCreateFormData {
  name: string;
  variant: string;
  unit: string;
  package_unit: string;
  package_size?: number;
  stock: number;
  min_stock_warning: number;
  category_id?: number;
}

interface InventoryCreateModalProps {
  isOpen: boolean;
  formData: InventoryCreateFormData;
  onChange: (field: keyof InventoryCreateFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InventoryCreateModal: React.FC<InventoryCreateModalProps> = ({
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
      title="Tambah Bahan Baku Baru"
      icon={<Package className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : 'Simpan Bahan'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama Bahan" required>
          <Input
            type="text"
            required
            value={formData.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="Contoh: Kertas Art Paper 260gr"
          />
        </Field>

        <Field label="Varian (Opsional)">
          <Input
            type="text"
            value={formData.variant}
            onChange={e => onChange('variant', e.target.value)}
            placeholder="Contoh: A3+ / Roll"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan Dasar (stok & pemakaian)">
            <Input
              type="text"
              value={formData.unit}
              onChange={e => onChange('unit', e.target.value)}
              placeholder="lembar / meter / pcs / ml"
            />
          </Field>
          <Field label="Stok Awal">
            <Input
              type="number"
              value={formData.stock}
              onChange={e => onChange('stock', Number(e.target.value))}
              className="font-bold"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kemasan Beli (opsional)">
            <Input
              type="text"
              value={formData.package_unit}
              onChange={e => onChange('package_unit', e.target.value)}
              placeholder="rim / rol / dus / botol"
            />
          </Field>
          <Field label="Isi per Kemasan">
            <Input
              type="number"
              min="0"
              value={formData.package_size ?? ''}
              onChange={e => onChange('package_size', e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder="mis. 500"
              className="font-bold"
            />
          </Field>
        </div>

        <Field label="Peringatan Stok Minimum">
          <Input
            type="number"
            value={formData.min_stock_warning}
            onChange={e => onChange('min_stock_warning', Number(e.target.value))}
            className="font-bold"
          />
        </Field>
      </div>
    </Modal>
  );
};
