'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MaterialLot, RawMaterial } from '../../types/rawMaterial';
import { rawMaterialService } from '../../services/rawMaterialService';
import { useAlert } from '../../context/AlertContext';
import { formatRupiah } from '../../utils/format';

interface InventoryLotModalProps {
  isOpen: boolean;
  material: RawMaterial | null;
  onClose: () => void;
  onRefreshMaterial?: () => void;
}

export const InventoryLotModal: React.FC<InventoryLotModalProps> = ({
  isOpen,
  material,
  onClose,
  onRefreshMaterial,
}) => {
  const { showAlert, showToast } = useAlert();
  const [lots, setLots] = useState<MaterialLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Lot Form State
  const [lotCode, setLotCode] = useState('');
  const [widthM, setWidthM] = useState<number>(material?.roll_width ? Number(material.roll_width) : 1.05);
  const [length, setLength] = useState<number>(50);
  const [unitCost, setUnitCost] = useState<number>(material?.standard_cost ? Number(material.standard_cost) : 0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLots = useCallback(async () => {
    if (!material) return;
    setLoading(true);
    try {
      const data = await rawMaterialService.getLots(material.id);
      setLots(data || []);
    } catch (err: any) {
      console.error('Failed to load lots:', err);
    } finally {
      setLoading(false);
    }
  }, [material]);

  useEffect(() => {
    if (isOpen && material) {
      fetchLots();
      setLotCode(`LOT-${material.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`);
      setWidthM(material.roll_width ? Number(material.roll_width) : 1.05);
      setLength(50);
      setUnitCost(material.standard_cost ? Number(material.standard_cost) : 0);
      setNotes('');
      setShowAddForm(false);
    }
  }, [isOpen, material, fetchLots]);

  if (!isOpen || !material) return null;

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotCode.trim() || widthM <= 0 || length <= 0) {
      await showAlert({
        title: 'Form Belum Lengkap',
        message: 'Kode lot, lebar (meter), dan panjang (meter) wajib diisi lebih dari 0.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      await rawMaterialService.receiveLot(material.id, {
        lot_code: lotCode.trim(),
        width_m: widthM,
        length: length,
        unit_cost: unitCost > 0 ? unitCost : undefined,
        notes: notes.trim() || undefined,
      });

      showToast(`Lot roll "${lotCode}" berhasil diterima dan stok m² ditambahkan!`, 'success');
      setShowAddForm(false);
      await fetchLots();
      onRefreshMaterial?.();
    } catch (err: any) {
      console.error('Failed to receive lot:', err);
      await showAlert({
        title: 'Gagal Menambah Lot Roll',
        message: err?.response?.data?.message || 'Terjadi kesalahan saat menerima roll baru.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Kelola Lot Roll & Offcut: {material.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Stok Total: <strong className="font-mono">{material.stock} {material.unit}</strong> • Terkunci: <strong className="font-mono text-amber-600">{material.reserved_stock} {material.unit}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Daftar Lot Aktif ({lots.length})
            </h4>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Terima Roll Baru</span>
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleCreateLot} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 space-y-3 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Penerimaan Roll Baru (Masuk Gudang):</span>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Batal</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Kode Lot / Roll:</label>
                  <input
                    type="text"
                    value={lotCode}
                    onChange={e => setLotCode(e.target.value)}
                    placeholder="Contoh: LOT-FLX-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main font-mono text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Lebar Roll (meter):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={widthM}
                    onChange={e => setWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main font-mono text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Panjang Roll (meter):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={length}
                    onChange={e => setLength(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main font-mono text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Biaya Standar / HPP (Opsional):</label>
                  <input
                    type="number"
                    min="0"
                    value={unitCost}
                    onChange={e => setUnitCost(Number(e.target.value))}
                    placeholder="Biaya per unit"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Catatan / Supplier:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Misal: Roll supplier PT Inti"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-text-main text-xs outline-none"
                  />
                </div>
              </div>

              <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/40 text-[11px] text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Luas total: <strong>{(widthM * length).toFixed(2)} m²</strong> akan langsung ditambahkan ke saldo fisik inventori.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Tambah Stok'}
                </button>
              </div>
            </form>
          )}

          {/* Lots List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Memuat daftar lot roll...</div>
          ) : lots.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-purple-500" />
              <p className="font-semibold">Belum ada lot roll terdaftar untuk bahan ini.</p>
              <p className="text-[11px] mt-1 text-slate-500">Klik &quot;Terima Roll Baru&quot; di atas untuk mendaftarkan roll pertama.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lots.map(lot => (
                <div key={lot.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {lot.lot_code}
                        </span>
                        {lot.is_offcut ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Sisa / Offcut
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Roll Penuh
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {lot.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lebar: <strong>{lot.width_m ? `${lot.width_m} m` : 'Standar'}</strong> • Diterima: {new Date(lot.received_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm block">
                        {lot.length_remaining} / {lot.length_total} m
                      </span>
                      {Number(lot.reserved_length) > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                          Terkunci: {lot.reserved_length} m
                        </span>
                      )}
                      {Number(lot.unit_cost) > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          HPP: {formatRupiah(lot.unit_cost)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold skeuo-button text-slate-600 dark:text-slate-400 text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
