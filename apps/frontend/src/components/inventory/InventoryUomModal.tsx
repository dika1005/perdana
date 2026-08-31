'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, CheckCircle2 } from 'lucide-react';
import { RawMaterial } from '../../types/rawMaterial';
import { rawMaterialService } from '../../services/rawMaterialService';
import { useAlert } from '../../context/AlertContext';
import { Modal, Button, Field, Input } from '../shared';

interface InventoryUomModalProps {
  isOpen: boolean;
  material: RawMaterial | null;
  onClose: () => void;
}

export const InventoryUomModal: React.FC<InventoryUomModalProps> = ({
  isOpen,
  material,
  onClose,
}) => {
  const { showAlert, showToast } = useAlert();
  const [fromUnit, setFromUnit] = useState('rim');
  const [toUnit, setToUnit] = useState('lembar');
  const [factor, setFactor] = useState<number>(500);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      const u = material.unit.toLowerCase();
      if (u === 'lembar') {
        setFromUnit('rim');
        setToUnit('lembar');
        setFactor(500);
        setNotes('1 rim = 500 lembar');
      } else if (u === 'pcs') {
        setFromUnit('box');
        setToUnit('pcs');
        setFactor(100);
        setNotes('1 box = 100 pcs');
      } else if (u === 'meter') {
        setFromUnit('roll');
        setToUnit('meter');
        setFactor(50);
        setNotes('1 roll = 50 meter');
      } else {
        setFromUnit('pack');
        setToUnit(material.unit);
        setFactor(100);
        setNotes('');
      }
    }
  }, [isOpen, material]);

  if (!material) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromUnit.trim() || !toUnit.trim() || factor <= 0) {
      await showAlert({
        title: 'Form Belum Lengkap',
        message: 'Satuan asal, satuan tujuan, dan faktor pengali wajib diisi lebih dari 0.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      await rawMaterialService.upsertUomConversion(material.id, {
        from_unit: fromUnit.trim(),
        to_unit: toUnit.trim(),
        factor: factor,
        notes: notes.trim() || undefined,
      });

      showToast(`Konversi 1 ${fromUnit} = ${factor} ${toUnit} berhasil disimpan!`, 'success');
      onClose();
    } catch (err: any) {
      console.error('Failed to save UOM conversion:', err);
      await showAlert({
        title: 'Gagal Menyimpan Konversi Satuan',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan konversi.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Konversi Satuan: ${material.name}`}
      subtitle={<>Satuan Dasar di Database: <strong className="text-text-main">{material.unit}</strong></>}
      icon={<ArrowUpDown className="w-5 h-5" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Menyimpan...' : 'Simpan Konversi'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan Kulakan (Dari)" required>
            <Input
              type="text"
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value)}
              placeholder="Misal: rim"
              required
              className="text-xs font-bold"
            />
          </Field>

          <Field label="Satuan Dasar (Ke)" required>
            <Input
              type="text"
              value={toUnit}
              onChange={e => setToUnit(e.target.value)}
              placeholder="Misal: lembar"
              required
              className="text-xs font-bold"
            />
          </Field>
        </div>

        <Field label={`Faktor Pengali (1 ${fromUnit || 'unit'} = berapa ${toUnit || 'unit'})`} required>
          <Input
            type="number"
            min="0.000001"
            step="any"
            value={factor}
            onChange={e => setFactor(Number(e.target.value))}
            placeholder="Contoh: 500"
            required
            className="font-mono font-bold"
          />
        </Field>

        <Field label="Keterangan (Opsional)">
          <Input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Misal: 1 rim = 500 lembar F4"
            className="text-xs"
          />
        </Field>

        <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Konversi satuan hanya mempengaruhi tampilan kalkulator & kulakan, dan tidak mengubah saldo fisik database.</span>
        </div>
      </div>
    </Modal>
  );
};
