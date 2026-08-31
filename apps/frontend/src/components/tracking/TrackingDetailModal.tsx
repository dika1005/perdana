'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CreditCard,
  Layers,
  DollarSign,
  History,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Customer } from '../../types/customer';
import { TransactionDetail } from '../../types/transaction';
import { formatRupiah } from '../../utils/format';
import { Modal, Button } from '../shared';

interface TrackingDetailModalProps {
  isOpen: boolean;
  job: TransactionDetail | any | null;
  customers: Customer[];
  onClose: () => void;
  onPrintSpk: (job: any) => void;
  onPrintReceipt: (invoiceData: any) => void;
  onOpenSettle?: (job: any) => void;
}

export const TrackingDetailModal: React.FC<TrackingDetailModalProps> = ({
  isOpen,
  job,
  customers,
  onClose,
  onPrintSpk,
  onPrintReceipt,
  onOpenSettle,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'materials' | 'payments' | 'events'>('items');

  if (!job) return null;

  const cust = customers.find(c => c.id === job.customer_id);
  const isDP = job.payment_status === 'DP' || job.payment_status === 'UNPAID';
  const remaining = Math.max(0, Number(job.total_amount) - Number(job.paid_amount ?? job.pay_amount ?? 0));

  // Extract all materials across all items
  const allItemMaterials: Array<{
    product_name: string;
    material_name: string;
    unit: string;
    required_qty: number;
    reserved_qty: number;
    consumed_qty: number;
    waste_qty: number;
    source_type: string;
  }> = [];

  (job.items || []).forEach((item: any) => {
    if (item.materials && Array.isArray(item.materials)) {
      item.materials.forEach((m: any) => {
        allItemMaterials.push({
          product_name: item.product_name || `Item #${item.id}`,
          material_name: m.material_name || `Bahan #${m.raw_material_id}`,
          unit: m.unit || '',
          required_qty: Number(m.required_qty) || 0,
          reserved_qty: Number(m.reserved_qty) || 0,
          consumed_qty: Number(m.consumed_qty) || 0,
          waste_qty: Number(m.waste_qty) || 0,
          source_type: m.source_type || 'MANUAL_POS',
        });
      });
    }
  });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={job.invoice_number}
      subtitle={
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {job.order_status}
          </span>
          <span className="font-mono">
            {new Date(job.created_at).toLocaleString('id-ID')} • Kasir: {job.cashier_name || 'Kasir'}
          </span>
        </span>
      }
      icon={<FileText className="w-5 h-5" />}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>

          <div className="ml-auto flex flex-wrap gap-2">
            {/* Tombol Cetak SPK (Hanya jika belum selesai diambil) */}
            {job.order_status !== 'DIAMBIL' && (
              <Button
                variant="secondary"
                className="text-blue-600 dark:text-blue-400"
                onClick={() => {
                  onClose();
                  onPrintSpk(job);
                }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak SPK Kerja</span>
              </Button>
            )}

            {/* Tombol Cetak Struk Nota Kasir */}
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                onPrintReceipt(job);
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak Struk Nota</span>
            </Button>

            {/* Tombol Lunasi jika DP */}
            {isDP && remaining > 0 && onOpenSettle && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onOpenSettle(job);
                }}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Proses Pelunasan</span>
              </Button>
            )}
          </div>
        </>
      }
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 text-xs font-semibold -mt-1 mb-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Item Pesanan ({job.items?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'materials'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bahan ({allItemMaterials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Pembayaran ({job.payments?.length || 1})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'events'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Timeline Event</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Customer info card (persistent) */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl skeuo-inset text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pelanggan:</span>
            <p className="font-bold text-text-main text-sm mt-0.5">{job.customer_name || 'Pelanggan Umum'}</p>
            {cust?.phone && <p className="text-slate-500 font-mono">{cust.phone}</p>}
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimasi Selesai:</span>
            <p className="font-bold text-text-main text-sm mt-0.5">
              {job.estimated_done_at || 'Secepatnya'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Metode: <strong>{job.payment_method || 'CASH'}</strong>
            </p>
          </div>
        </div>

        {/* Tab: Items */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {(job.items || []).map((item: any, idx: number) => {
                const unitPrice = Number(item.price || item.custom_price || item.unit_price || 0);
                const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * item.qty);

                return (
                  <div key={idx} className="p-3.5 rounded-xl skeuo-sm space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-text-main">
                          {item.product_name}
                        </h4>
                        {item.variant_name && (
                          <span className="text-[11px] text-slate-500">Varian: {item.variant_name}</span>
                        )}
                        {(() => {
                          const isMeterItem = ((item.unit_name || '') + ' ' + (item.product_name || item.name || '')).toLowerCase().includes('meter');
                          return isMeterItem && item.length && item.width ? (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                              Ukuran: {item.length}m × {item.width}m (Luas: {(item.length * item.width * item.qty).toFixed(2)} m²)
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-text-main">
                          {formatRupiah(subtotal)}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.qty} {item.unit_name || 'pcs'} × {formatRupiah(unitPrice)}
                        </p>
                      </div>
                    </div>

                    {item.addons && item.addons.length > 0 && (
                      <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Finishing:</span>
                        <span>{item.addons.map((a: any) => `${a.addon_name || a}${a.qty > 1 ? ` (${a.qty}x)` : ''}`).join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financial summary */}
            <div className="p-4 rounded-xl skeuo-inset space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-text-main">{formatRupiah(job.subtotal_amount || job.total_amount)}</span>
              </div>
              {Number(job.discount_amount) > 0 && (
                <div className="flex justify-between text-rose-500 font-semibold">
                  <span>Diskon:</span>
                  <span className="font-mono">- {formatRupiah(job.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>Total Tagihan:</span>
                <span className="font-mono text-text-main">{formatRupiah(job.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Telah Dibayar (Neto):</span>
                <span className="font-mono">{formatRupiah(job.paid_amount ?? job.pay_amount ?? 0)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center">
                <span className="font-bold text-text-main">Status Pembayaran:</span>
                {isDP && remaining > 0 ? (
                  <span className="font-bold font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                    Sisa Tagihan: {formatRupiah(remaining)}
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    LUNAS
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Materials (Snapshot Bahan) */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            {allItemMaterials.length === 0 ? (
              <div className="p-8 text-center skeuo-inset rounded-xl text-slate-400 text-xs">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Tidak ada bahan baku tercatat untuk pesanan ini.</p>
                <p className="text-[11px] mt-1 text-slate-500">Bahan diinput manual saat checkout dan dikunci oleh server saat pesanan dibuat dengan DP/lunas.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Snapshot kebutuhan bahan tersimpan permanen pada database untuk keakuratan audit stok.</span>
                </div>

                {allItemMaterials.map((mat, i) => (
                  <div key={i} className="p-3.5 rounded-xl skeuo-sm text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {mat.product_name}
                        </span>
                        <h4 className="font-bold text-text-main text-sm">
                          {mat.material_name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {mat.source_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60">
                        <span className="text-[10px] text-slate-400 block font-semibold">Dibutuhkan</span>
                        <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                          {mat.required_qty} {mat.unit}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">Terkunci</span>
                        <span className="font-bold font-mono text-amber-700 dark:text-amber-300">
                          {mat.reserved_qty} {mat.unit}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Terkonsumsi</span>
                        <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">
                          {mat.consumed_qty} {mat.unit}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50">
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold">Waste/Rusak</span>
                        <span className="font-bold font-mono text-rose-700 dark:text-rose-300">
                          {mat.waste_qty} {mat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Payments Ledger */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            {job.payments && job.payments.length > 0 ? (
              <div className="space-y-2">
                {job.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border text-xs flex justify-between items-center ${
                      p.payment_type === 'REFUND'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded ${
                          p.payment_type === 'REFUND'
                            ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {p.payment_type === 'REFUND' ? 'Refund' : 'Pembayaran'}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          Metode: {p.payment_method}
                        </span>
                      </div>
                      {p.notes && <p className="text-[11px] text-slate-500 mt-1">{p.notes}</p>}
                      {p.reference_no && <p className="text-[10px] font-mono text-slate-400">Ref: {p.reference_no}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleString('id-ID')}</p>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm ${
                        p.payment_type === 'REFUND' ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {p.payment_type === 'REFUND' ? '-' : '+'}{formatRupiah(p.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl skeuo-inset text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Pembayaran Saat Checkout:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatRupiah(job.paid_amount ?? job.pay_amount ?? 0)}
                  </span>
                </div>
                {job.settlement_pay_amount && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Pelunasan ({job.settlement_payment_method || 'CASH'}):</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{formatRupiah(job.settlement_pay_amount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Events Timeline */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {job.production_events && job.production_events.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {job.production_events.map((ev: any, i: number) => (
                  <div key={ev.id || i} className="relative">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                    <div className="p-3 rounded-xl skeuo-sm text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-text-main font-mono text-[11px]">
                          {ev.event_type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ev.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {ev.notes && <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ev.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center skeuo-inset rounded-xl text-slate-400 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Log peristiwa produksi belum tersedia untuk pesanan ini.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
