'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Layers, Package } from 'lucide-react';
import { RawMaterial } from '../../types/rawMaterial';
import { Modal, Button } from '../shared';

interface InventoryRestockModalProps {
  isOpen: boolean;
  selectedItem: RawMaterial | null;
  mutationQty: number;
  onChangeQty: (val: number) => void;
  mutationUnit: string;
  onChangeUnit: (val: string) => void;
  mutationNotes: string;
  onChangeNotes: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const fmt = (v: number) => Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 });

export const InventoryRestockModal: React.FC<InventoryRestockModalProps> = ({
  isOpen,
  selectedItem,
  mutationQty,
  onChangeQty,
  mutationUnit,
  onChangeUnit,
  mutationNotes,
  onChangeNotes,
  submitting,
  onClose,
  onSubmit,
}) => {
  // Master kemasan (package_unit/package_size) adalah SATU-SATUNYA sumber
  // konversi. Penggandaian dilakukan di SERVER (to_base_unit) saat submit —
  // klien hanya mengirim jumlah kemasan + nama satuannya. Ini mencegah
  // konversi ganda dan faktor heuristik yang meleset (bug box 500 vs 100).
  const packageUnit = (selectedItem?.package_unit || '').trim();
  const packageSize = Number(selectedItem?.package_size || 0);
  const hasMasterPackage = !!packageUnit && packageSize > 0;

  const [inputMode, setInputMode] = useState<'BULK' | 'BASE'>('BASE');
  const [bulkCount, setBulkCount] = useState<number>(1);

  // Reset pilihan setiap kali modal dibuka (bahan bisa berbeda dari
  // pembukaan sebelumnya) agar tidak ada state lama yang bocor.
  useEffect(() => {
    if (isOpen && selectedItem) {
      const nextMode: 'BULK' | 'BASE' = hasMasterPackage ? 'BULK' : 'BASE';
      setInputMode(nextMode);
      setBulkCount(1);
      onChangeQty(1);
      onChangeUnit(nextMode === 'BULK' ? packageUnit.toLowerCase() : selectedItem.unit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedItem]);

  if (!selectedItem) return null;

  const isBulk = inputMode === 'BULK' && hasMasterPackage;
  // Estimasi total satuan dasar hanya untuk pratinjau; angka final dihitung
  // ulang di server dari konversi tersimpan.
  const baseTotal = isBulk ? mutationQty * packageSize : mutationQty;
  const currentStock = Number(selectedItem.stock) || 0;
  const newStock = currentStock + baseTotal;

  const handleBulkChange = (val: number) => {
    const safeVal = Math.max(1, val);
    setBulkCount(safeVal);
    onChangeQty(safeVal);
    onChangeUnit(packageUnit.toLowerCase());
  };

  const handleBaseChange = (val: number) => {
    const safeVal = Math.max(1, val);
    onChangeQty(safeVal);
    onChangeUnit(selectedItem.unit);
  };

  const setPresetBulk = (count: number) => {
    setInputMode('BULK');
    setBulkCount(count);
    onChangeQty(count);
    onChangeUnit(packageUnit.toLowerCase());
  };

  const switchMode = (mode: 'BULK' | 'BASE') => {
    if (mode === 'BULK' && !hasMasterPackage) return;
    setInputMode(mode);
    setBulkCount(1);
    onChangeQty(1);
    onChangeUnit(mode === 'BULK' ? packageUnit.toLowerCase() : selectedItem.unit);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Restock Stok Bahan Masuk (IN)"
      subtitle={<>Kulakan / Penambahan stok gudang untuk <strong className="text-text-main">{selectedItem.name}</strong></>}
      icon={<Package className="w-5 h-5" />}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={onSubmit}
            disabled={submitting || mutationQty <= 0}
          >
            {submitting ? 'Menyimpan...' : isBulk
              ? `Tambah +${mutationQty.toLocaleString()} ${packageUnit}`
              : `Tambah +${mutationQty.toLocaleString()} ${selectedItem.unit}`}
          </Button>
        </>
      }
    >
      {/* Current Stock Banner */}
      <div className="mb-4 p-3 rounded-xl skeuo-inset flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Stok Saat Ini:</span>
          <span className="text-sm font-extrabold text-text-main font-mono">
            {currentStock.toLocaleString()} {selectedItem.unit}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Estimasi Setelah Restock:</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            +{fmt(baseTotal)} {selectedItem.unit} → {fmt(newStock)} {selectedItem.unit}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mode Selector: hanya saat kemasan kulakan terdaftar di master data.
            Konversi dihitung server; klien tidak mengalikan apa pun. */}
        {hasMasterPackage ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Satuan Pembelian / Kulakan Masuk:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => switchMode('BULK')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isBulk
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Per {packageUnit} (1 = {fmt(packageSize)} {selectedItem.unit})</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('BASE')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isBulk
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>Ketik Eceran ({selectedItem.unit})</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
            Kemasan kulakan belum diatur untuk bahan ini (mis. 1 box = 100 pcs).
            Atur lewat tombol <strong>UOM</strong> di tabel agar bisa restock per kemasan;
            untuk saat ini input dalam satuan dasar ({selectedItem.unit}).
          </div>
        )}

        {/* Input Qty */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isBulk ? `Jumlah Masuk (per ${packageUnit}):` : `Jumlah Lembar / Meter Masuk (${selectedItem.unit}):`}
          </label>

          {inputMode === 'BULK' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-950 border-2 border-blue-500/80 rounded-xl">
                <ArrowUpRight className="w-5 h-5 text-emerald-500 shrink-0" />
                <input
                  type="number"
                  min="1"
                  value={bulkCount}
                  onChange={e => handleBulkChange(Number(e.target.value))}
                  placeholder={`Contoh: 10 ${packageUnit}`}
                  className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 font-extrabold text-base font-mono"
                />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md shrink-0">
                  {packageUnit}
                </span>
              </div>

              {/* Quick Presets for Bulk */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Pilihan Cepat:</span>
                {[1, 5, 10, 20, 50].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPresetBulk(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      bulkCount === cnt
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                    }`}
                  >
                    +{cnt} {packageUnit}
                  </button>
                ))}
              </div>

              {/* Pratinjau konversi (final dihitung server dari master konversi) */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                = {fmt(baseTotal)} {selectedItem.unit} — dikalikan di server dari konversi tersimpan.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-emerald-500 shrink-0" />
              <input
                type="number"
                min="1"
                value={mutationQty}
                onChange={e => handleBaseChange(Number(e.target.value))}
                placeholder={`Contoh: 500`}
                className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 font-extrabold text-base font-mono"
              />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0">
                {selectedItem.unit}
              </span>
            </div>
          )}
        </div>

        {/* Keterangan / Supplier */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Catatan / Nama Supplier (Opsional):
          </label>
          <textarea
            value={mutationNotes}
            onChange={e => onChangeNotes(e.target.value)}
            placeholder="Contoh: Kulakan dari Toko Kertas Maju Jaya..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-slate-100 text-xs resize-none focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
};
