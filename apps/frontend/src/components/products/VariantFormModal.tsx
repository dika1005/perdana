import React from 'react';
import { Layers } from 'lucide-react';
import { ProductVariant, RangePriceType } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { Modal, Button, Field, Input, Select } from '../shared';

interface VariantFormData {
  variant_name: string;
  price_type: RangePriceType;
  price: number;
  min_price: number;
  max_price: number;
  raw_material_id?: number;
  material_amount?: number;
}

interface VariantFormModalProps {
  isOpen: boolean;
  item: ProductVariant | null;
  rawMaterials?: RawMaterial[];
  formData: VariantFormData;
  onChange: (field: keyof VariantFormData, value: any) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const VariantFormModal: React.FC<VariantFormModalProps> = ({
  isOpen,
  item,
  rawMaterials = [],
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
      title={item ? 'Edit Varian' : 'Tambah Varian Baru'}
      icon={<Layers className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : 'Simpan Varian'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama Varian" required>
          <Input
            type="text"
            required
            value={formData.variant_name}
            onChange={e => onChange('variant_name', e.target.value)}
            placeholder="Contoh: Glossy 260gr / Ukuran A3+"
          />
        </Field>

        <Field label="Tipe Harga">
          <Select
            value={formData.price_type}
            onChange={e => onChange('price_type', e.target.value as RangePriceType)}
          >
            <option value="FIXED">FIXED (Harga Tetap)</option>
            <option value="RANGE">RANGE (Rentang)</option>
          </Select>
        </Field>

        {/* Bahan Baku Varian */}
        <div className="p-3.5 rounded-xl skeuo-inset space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
            <Layers className="w-4 h-4" />
            <span>Bahan Baku Varian</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <Field label="Bahan Baku Terkait">
              <Select
                value={formData.raw_material_id || ''}
                onChange={e => onChange('raw_material_id', e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs"
              >
                <option value="">-- Ikuti Bahan Produk Utama / Tidak Terhubung --</option>
                {rawMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit}) - Stok: {m.stock}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Konsumsi per Unit / m²">
              <Input
                type="number"
                step="any"
                min="0.01"
                value={formData.material_amount !== undefined ? formData.material_amount : 1}
                onChange={e => onChange('material_amount', Number(e.target.value))}
                placeholder="1.0"
                className="text-xs font-bold"
              />
            </Field>
          </div>
        </div>

        {formData.price_type === 'FIXED' ? (
          <Field label="Harga Varian (Rp)">
            <Input
              type="number"
              value={formData.price}
              onChange={e => onChange('price', Number(e.target.value))}
              className="font-bold"
            />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min. Harga (Rp)">
              <Input
                type="number"
                value={formData.min_price}
                onChange={e => onChange('min_price', Number(e.target.value))}
              />
            </Field>
            <Field label="Max. Harga (Rp)">
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
