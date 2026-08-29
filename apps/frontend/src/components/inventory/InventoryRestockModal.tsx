'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, X, Layers, Package } from 'lucide-react';
import { RawMaterial } from '../../types/rawMaterial';

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

  // Input Mode: 'BULK' (Rim/Roll/Box) atau 'BASE' (Lembar/Meter/Pcs)
  const defaultMode = (isPaper && variant.includes('rim')) || isBanner || isBoxed ? 'BULK' : 'BASE';
  const [inputMode, setInputMode] = useState<'BULK' | 'BASE'>(defaultMode);
  const [bulkCount, setBulkCount] = useState<number>(10);

  // Multiplier konversi
  const multiplier = isPaper && variant.includes('rim') ? 500 : isBanner ? 50 : isBoxed ? 100 : 1;
  const bulkUnitLabel = isPaper && variant.includes('rim') ? 'Rim' : isBanner ? 'Roll' : isBoxed ? 'Box' : (selectedItem?.unit || 'pcs');

  // Sinkronisasi bulk count ke mutationQty
  useEffect(() => {
    if (isOpen && selectedItem && inputMode === 'BULK') {
      onChangeQty(Math.max(1, bulkCount * multiplier));
    }
  }, [isOpen, selectedItem, bulkCount, inputMode, multiplier, onChangeQty]);

  if (!isOpen || !selectedItem) return null;

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

  const currentStock = selectedItem.stock;
  const newStock = currentStock + (mutationQty || 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-8 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Restock Stok Bahan Masuk (IN)</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Kulakan / Penambahan stok gudang untuk <strong>{selectedItem.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stock Banner */}
        <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Stok Saat Ini:</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
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
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        bulkCount === cnt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
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

        {/* Modal Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold skeuo-button text-slate-600 dark:text-slate-400 text-xs rounded-xl"
            disabled={submitting}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || mutationQty <= 0}
            className="flex-1 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            {submitting ? 'Menyimpan...' : `Tambah +${mutationQty.toLocaleString()} ${selectedItem.unit}`}
          </button>
        </div>
      </div>
    </div>
  );
};
