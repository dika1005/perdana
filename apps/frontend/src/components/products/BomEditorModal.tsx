'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { BomLineInput } from '../../types/product';
import { RawMaterial } from '../../types/rawMaterial';
import { productService } from '../../services/productService';
import { useAlert } from '../../context/AlertContext';

type Target = { kind: 'product' | 'addon'; id: number; name: string } | null;

const blankLine = (rawMaterials: RawMaterial[]): BomLineInput => ({
  raw_material_id: rawMaterials[0]?.id || 0,
  consumption_basis: 'PER_UNIT',
  qty_per_output: 1,
  waste_pct: 0,
  allow_offcut: true,
  is_required: true,
  component_type: 'MATERIAL',
});

export function BomEditorModal({
  target,
  rawMaterials,
  onClose,
}: {
  target: Target;
  rawMaterials: RawMaterial[];
  onClose: () => void;
}) {
  const { showAlert, showToast } = useAlert();
  const [lines, setLines] = useState<BomLineInput[]>([]);
  const [outputQty, setOutputQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    let active = true;
    setLoading(true);
    const load = async () => {
      try {
        if (target.kind === 'product') {
          const bom = await productService.getProductBom(target.id);
          if (!active) return;
          setLines(bom?.lines?.length ? bom.lines : [blankLine(rawMaterials)]);
          setOutputQty(Number(bom?.output_qty || 1));
          setNotes(bom?.notes || '');
        } else {
          const bom = await productService.getAddonBom(target.id);
          if (!active) return;
          setLines(bom?.length ? bom : [blankLine(rawMaterials)]);
          setOutputQty(1);
          setNotes('');
        }
      } catch (error: any) {
        if (active) {
          setLines([blankLine(rawMaterials)]);
          await showAlert({ title: 'Gagal Memuat BOM', message: error?.response?.data?.message || 'Resep bahan belum dapat dimuat.', type: 'error' });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [target, rawMaterials, showAlert]);

  if (!target) return null;

  const updateLine = (index: number, field: keyof BomLineInput, value: any) => {
    setLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lines.length === 0 || lines.some(line => !line.raw_material_id || Number(line.qty_per_output) <= 0)) {
      await showAlert({ title: 'BOM Belum Valid', message: 'Setiap baris wajib memiliki bahan dan kuantitas lebih dari nol.', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      if (target.kind === 'product') {
        await productService.saveProductBom(target.id, { output_qty: outputQty, notes: notes || undefined, lines });
      } else {
        await productService.saveAddonBom(target.id, lines);
      }
      showToast('BOM aktif berhasil disimpan. Pesanan berikutnya memakai versi ini.', 'success');
      onClose();
    } catch (error: any) {
      await showAlert({ title: 'Gagal Menyimpan BOM', message: error?.response?.data?.message || 'Periksa konfigurasi bahan dan coba lagi.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <form onSubmit={save} className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-text-main">BOM {target.kind === 'product' ? 'Produk' : 'Finishing'}: {target.name}</h2>
            <p className="text-xs text-slate-500 mt-1">Sumber kebenaran kebutuhan bahan dan reservasi stok. Menyimpan perubahan produk membuat versi BOM baru.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        {target.kind === 'product' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 text-xs">
            <label className="font-semibold text-slate-600">Output resep
              <input type="number" min="0.0001" step="0.0001" value={outputQty} onChange={e => setOutputQty(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-text-main" />
            </label>
            <label className="font-semibold text-slate-600">Catatan versi
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Misal: revisi kertas cover 2026" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-text-main" />
            </label>
          </div>
        )}
        <div className="space-y-3 py-4">
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3 text-xs">
              <select value={line.raw_material_id} onChange={e => updateLine(index, 'raw_material_id', Number(e.target.value))} className="md:col-span-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-text-main">
                {rawMaterials.map(material => <option key={material.id} value={material.id}>{material.name} — tersedia {material.available_stock} {material.unit}</option>)}
              </select>
              <select value={line.consumption_basis} onChange={e => updateLine(index, 'consumption_basis', e.target.value)} className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-text-main">
                <option value="PER_UNIT">Per unit</option><option value="PER_AREA">Per m²</option><option value="PER_LENGTH">Per meter</option><option value="FIXED">Tetap/order</option>
              </select>
              <input aria-label="Kuantitas" type="number" min="0.0001" step="0.0001" value={line.qty_per_output} onChange={e => updateLine(index, 'qty_per_output', Number(e.target.value))} className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-text-main" placeholder="Qty" />
              <input aria-label="Waste persen" type="number" min="0" max="0.9999" step="0.0001" value={line.waste_pct || 0} onChange={e => updateLine(index, 'waste_pct', Number(e.target.value))} className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-text-main" placeholder="Waste 0.05" />
              <button type="button" onClick={() => setLines(current => current.filter((_, lineIndex) => lineIndex !== index))} disabled={lines.length === 1} className="md:col-span-1 rounded-lg border border-rose-200 text-rose-600 disabled:opacity-30 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
              <label className="md:col-span-12 flex items-center gap-2 text-slate-600"><input type="checkbox" checked={line.allow_offcut !== false} onChange={e => updateLine(index, 'allow_offcut', e.target.checked)} /> Gunakan offcut bila ukurannya mencukupi</label>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLines(current => [...current, blankLine(rawMaterials)])} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus className="w-4 h-4" /> Tambah komponen</button>
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200">Batal</button><button disabled={loading || saving} className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white flex items-center gap-1 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Aktifkan BOM'}</button></div>
      </form>
    </div>
  );
}
