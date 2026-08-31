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
  mutationNotes: string;
  onChangeNotes: (val: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const InventoryRestockModal: React.FC<InventoryRestockModalProps> = ({
  isOpen,
  selectedItem,
  mutationQty,
  onChangeQty,
  mutationNotes,
  onChangeNotes,
  submitting,
  onClose,
  onSubmit,
}) => {
  const unit = selectedItem?.unit?.toLowerCase() || '';
  const variant = (selectedItem?.variant || '').toLowerCase();

  // Tentukan apakah bahan ini lazimnya dibeli per Rim / per Roll / per Box
  const isPaper = unit === 'lembar' || variant.includes('rim');
  const isBanner = unit === 'meter' || variant.includes('roll');
  const isBoxed = unit === 'pcs' && (variant.includes('box') || variant.includes('pack') || variant.includes('isi 100'));

  // Konversi kemasan: utamakan master data (package_unit/package_size),
  // fallback heuristik untuk bahan yang belum dikonfigurasi.
  const hasMasterPackage = !!selectedItem?.package_unit && Number(selectedItem?.package_size || 0) > 0;
  const multiplier = hasMasterPackage
    ? Number(selectedItem!.package_size)
    : isPaper && variant.includes('rim') ? 500 : isBanner ? 50 : isBoxed ? 100 : 1;
  const bulkUnitLabel = hasMasterPackage
    ? selectedItem!.package_unit!
    : isPaper && variant.includes('rim') ? 'Rim' : isBanner ? 'Roll' : isBoxed ? 'Box' : (selectedItem?.unit || 'pcs');

  // Input Mode: 'BULK' (Rim/Roll/Box) atau 'BASE' (Lembar/Meter/Pcs)
  const defaultMode = multiplier > 1 ? 'BULK' : 'BASE';
  const [inputMode, setInputMode] = useState<'BULK' | 'BASE'>(defaultMode);
  const [bulkCount, setBulkCount] = useState<number>(10);

  // Sinkronisasi bulk count ke mutationQty
  useEffect(() => {
    if (isOpen && selectedItem && inputMode === 'BULK') {
      onChangeQty(Math.max(1, bulkCount * multiplier));
    }
  }, [isOpen, selectedItem, bulkCount, inputMode, multiplier, onChangeQty]);

  if (!selectedItem) return null;

  const handleBulkChange = (val: number) => {
    const safeVal = Math.max(1, val);
    setBulkCount(safeVal);
    onChangeQty(safeVal * multiplier);
  };

  const handleBaseChange = (val: number) => {
    const safeVal = Math.max(1, val);
    onChangeQty(safeVal);
  };

  const setPresetBulk = (count: number) => {
    setInputMode('BULK');
    setBulkCount(count);
    onChangeQty(count * multiplier);
  };

  const currentStock = Number(selectedItem.stock) || 0;
  const newStock = currentStock + (mutationQty || 0);

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
            {submitting ? 'Menyimpan...' : `Tambah +${mutationQty.toLocaleString()} ${selectedItem.unit}`}
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
            +{mutationQty.toLocaleString()} {selectedItem.unit} → {newStock.toLocaleString()} {selectedItem.unit}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mode Selector (Jika bahan bisa dihitung per Rim/Roll/Box) */}
        {multiplier > 1 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Satuan Pembelian / Kulakan Masuk:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setInputMode('BULK');
                  onChangeQty(bulkCount * multiplier);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputMode === 'BULK'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Per {bulkUnitLabel} (x{multiplier} {selectedItem.unit})</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('BASE')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  inputMode === 'BASE'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>Ketik Eceran ({selectedItem.unit})</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Qty */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {inputMode === 'BULK' ? `Jumlah Masuk (dalam Satuan ${bulkUnitLabel}):` : `Jumlah Lembar / Meter Masuk (${selectedItem.unit}):`}
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
                  placeholder={`Contoh: 10 ${bulkUnitLabel}`}
                  className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 font-extrabold text-base font-mono"
                />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md shrink-0">
                  {bulkUnitLabel}
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
                    +{cnt} {bulkUnitLabel}
                  </button>
                ))}
              </div>
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
