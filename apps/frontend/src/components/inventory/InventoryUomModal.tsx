'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, CheckCircle2 } from 'lucide-react';
import { RawMaterial, UomConversion } from '../../types/rawMaterial';
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
  // Master kemasan beli — sumber konversi utama untuk restock & display tabel.
  const [packageUnit, setPackageUnit] = useState('');
  const [packageSize, setPackageSize] = useState<number>(0);
  // Konversi satuan (form upsert).
  const [fromUnit, setFromUnit] = useState('box');
  const [toUnit, setToUnit] = useState('pcs');
  const [factor, setFactor] = useState<number>(100);
  const [notes, setNotes] = useState('');
  const [conversions, setConversions] = useState<UomConversion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      setPackageUnit(material.package_unit || '');
      setPackageSize(Number(material.package_size || 0));
      const load = async () => {
        setLoading(true);
        try {
          const data = await rawMaterialService.getUomConversions(material.id);
          setConversions(data || []);
          // Prefill faktor yang SUDAH tersimpan untuk pasangan kemasan -> dasar,
          // bukan menebak dari heuristik (mencegah faktor benar tertimpa default).
          const pkg = (material.package_unit || '').trim().toLowerCase();
          const base = material.unit.toLowerCase();
          const existing = pkg
            ? (data || []).find(
                c => c.from_unit.toLowerCase() === pkg && c.to_unit.toLowerCase() === base,
              )
            : undefined;
          if (existing) {
            setFromUnit(existing.from_unit);
            setToUnit(existing.to_unit);
            setFactor(Number(existing.factor));
            setNotes(existing.notes || '');
          } else {
            const u = material.unit.toLowerCase();
            if (u === 'lembar') {
              setFromUnit('rim'); setToUnit('lembar'); setFactor(500); setNotes('1 rim = 500 lembar');
            } else if (u === 'pcs') {
              setFromUnit('box'); setToUnit('pcs'); setFactor(100); setNotes('1 box = 100 pcs');
            } else if (u === 'meter') {
              setFromUnit('roll'); setToUnit('meter'); setFactor(50); setNotes('1 roll = 50 meter');
            } else {
              setFromUnit('pack'); setToUnit(material.unit); setFactor(100); setNotes('');
            }
          }
        } catch (err) {
          console.error('Failed to load UOM conversions:', err);
          setConversions([]);
        } finally {
          setLoading(false);
        }
      };
      load();
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
      // 1) Simpan master kemasan bila berubah. Update parsial: field lain
      //    (kategori, varian, dst.) tidak ikut tertimpa di server.
      const pkgUnit = packageUnit.trim();
      const pkgSize = Number(packageSize);
      const pkgChanged =
        pkgUnit !== (material.package_unit || '').trim() ||
        (pkgSize > 0 ? pkgSize : 0) !== Number(material.package_size || 0);
      if (pkgChanged) {
        await rawMaterialService.updateRawMaterial(material.id, {
          name: material.name,
          package_unit: pkgUnit,
          package_size: pkgSize > 0 ? pkgSize : undefined,
        });
      }

      // 2) Simpan konversi. Bila pasangannya sama dengan kemasan -> satuan
      //    dasar, server otomatis menyinkronkan package_size (satu sumber).
      await rawMaterialService.upsertUomConversion(material.id, {
        from_unit: fromUnit.trim(),
        to_unit: toUnit.trim(),
        factor: factor,
        notes: notes.trim() || undefined,
      });

      showToast(`Konversi 1 ${fromUnit.trim()} = ${factor} ${toUnit.trim()} berhasil disimpan!`, 'success');
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
        {/* Master kemasan beli (sumber konversi restock & display tabel) */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Kemasan Kulakan (Master)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Kemasan">
              <Input
                type="text"
                value={packageUnit}
                onChange={e => setPackageUnit(e.target.value)}
                placeholder="box / rim / rol / dus"
                className="text-xs font-bold"
              />
            </Field>
            <Field label="Isi per Kemasan">
              <Input
                type="number"
                min="0"
                step="any"
                value={packageSize || ''}
                onChange={e => setPackageSize(Number(e.target.value))}
                placeholder="mis. 100"
                className="font-mono font-bold"
              />
            </Field>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Kosongkan bila bahan dibeli langsung dalam satuan dasar ({material.unit}).
          </p>
        </div>

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

        {/* Konversi yang sudah tersimpan di database */}
        <div>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Konversi Tersimpan {loading && <span className="text-slate-400 font-normal">(memuat...)</span>}
          </p>
          {conversions.length === 0 ? (
            <p className="text-[11px] text-slate-400">Belum ada konversi tersimpan.</p>
          ) : (
            <ul className="space-y-1">
              {conversions.map(c => (
                <li key={c.id} className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  1 {c.from_unit} = {Number(c.factor).toLocaleString('id-ID')} {c.to_unit}
                  {c.notes ? <span className="text-slate-400 font-sans"> — {c.notes}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Konversi dipakai <strong>server</strong> untuk menghitung restock per kemasan
            (1 kemasan = faktor × {material.unit}) serta tampilan &quot;≈ X kemasan&quot; di tabel.
            Bila pasangan satuan di atas sama dengan kemasan kulakan, isi per kemasan otomatis
            disinkronkan. Mengubah faktor tidak mengubah saldo stok — lakukan opname bila perlu koreksi saldo.
          </span>
        </div>
      </div>
    </Modal>
  );
};
