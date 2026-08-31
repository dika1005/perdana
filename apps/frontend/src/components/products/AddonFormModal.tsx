'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { ProductAddon, RangePriceType } from '../../types/product';
import { Category } from '../../types/category';
import { Modal, Button, Field, Input, Select } from '../shared';

interface AddonFormData {
  name: string;
  category_id?: number | null;
  price_type: RangePriceType;
  default_price: number;
  min_price: number;
  max_price: number;
}

interface AddonFormModalProps {
  isOpen: boolean;
  item: ProductAddon | null;
  categories: Category[];
  formData: AddonFormData;
  onChange: (field: keyof AddonFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddonFormModal: React.FC<AddonFormModalProps> = ({
  isOpen,
  item,
  categories,
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
      title={item ? 'Edit Add-on' : 'Tambah Add-on / Finishing'}
      icon={<Tag className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : 'Simpan Add-on'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama Finishing / Add-on" required>
          <Input
            type="text"
            required
            value={formData.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="Contoh: Tambah Pita Rumbai / Cutting Stiker"
          />
        </Field>

        <Field
          label="Kategori Produk Terkait"
          hint="Jika dipilih, add-on hanya akan muncul di kasir saat produk dalam kategori ini dipilih."
        >
          <Select
            value={formData.category_id || ''}
            onChange={e => onChange('category_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Semua Kategori (Global / Umum)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Tipe Harga">
          <Select
            value={formData.price_type}
            onChange={e => onChange('price_type', e.target.value as RangePriceType)}
          >
            <option value="FIXED">FIXED (Harga Tetap)</option>
            <option value="RANGE">RANGE (Rentang Harga)</option>
          </Select>
        </Field>

        {formData.price_type === 'FIXED' ? (
          <Field label="Tarif Finishing (Rp)">
            <Input
              type="number"
              value={formData.default_price}
              onChange={e => onChange('default_price', Number(e.target.value))}
              className="font-bold"
            />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min. Tarif (Rp)">
              <Input
                type="number"
                value={formData.min_price}
                onChange={e => onChange('min_price', Number(e.target.value))}
              />
            </Field>
            <Field label="Max. Tarif (Rp)">
              <Input
                type="number"
                value={formData.max_price}
                onChange={e => onChange('max_price', Number(e.target.value))}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
};
