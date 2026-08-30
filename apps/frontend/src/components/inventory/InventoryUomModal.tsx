'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import { RawMaterial } from '../../types/rawMaterial';
import { rawMaterialService } from '../../services/rawMaterialService';
import { useAlert } from '../../context/AlertContext';

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

  if (!isOpen || !material) return null;

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Konversi Satuan: {material.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Satuan Dasar di Database: <strong>{material.unit}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Satuan Kulakan (Dari):</label>
              <input
                type="text"
                value={fromUnit}
                onChange={e => setFromUnit(e.target.value)}
                placeholder="Misal: rim"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main text-xs outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Satuan Dasar (Ke):</label>
              <input
                type="text"
                value={toUnit}
                onChange={e => setToUnit(e.target.value)}
                placeholder="Misal: lembar"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main text-xs outline-none font-bold"
                required
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Faktor Pengali (1 {fromUnit || 'unit'} = berapa {toUnit || 'unit'}):
            </label>
            <input
              type="number"
              min="0.000001"
              step="any"
              value={factor}
              onChange={e => setFactor(Number(e.target.value))}
              placeholder="Contoh: 500"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-text-main text-sm font-mono font-bold outline-none"
              required
            />
          </div>

          <div className="text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Keterangan (Opsional):</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Misal: 1 rim = 500 lembar F4"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main text-xs outline-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Konversi satuan hanya mempengaruhi tampilan kalkulator & kulakan, dan tidak mengubah saldo fisik database.</span>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold skeuo-button text-slate-600 dark:text-slate-400 text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl shadow-md disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Konversi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
