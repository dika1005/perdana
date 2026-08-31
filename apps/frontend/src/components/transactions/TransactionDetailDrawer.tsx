'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Clock, 
  Layers, 
  DollarSign, 
  History, 
  Package, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { formatRupiah } from '../../utils/format';
import { getPaymentMethod } from '../../data/paymentMethods';

interface TransactionDetailDrawerProps {
  transaction: any | null;
  onClose: () => void;
  onRefund?: (transaction: any) => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
  onRefund,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'payments' | 'events'>('info');

  if (!transaction) return null;

  const netPaid = Number(transaction.paid_amount ?? transaction.pay_amount) || 0;
  const remaining = Math.max(0, Number(transaction.total_amount) - netPaid);

  // Extract all materials across all items
  const allMaterials: Array<{
    product_name: string;
    material_name: string;
    unit: string;
    required_qty: number;
    reserved_qty: number;
    consumed_qty: number;
    waste_qty: number;
    source_type: string;
  }> = [];

  (transaction.items || []).forEach((item: any) => {
    if (item.materials && Array.isArray(item.materials)) {
      item.materials.forEach((m: any) => {
        allMaterials.push({
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-lg bg-bg-skeuo h-full p-6 skeuo overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b border-black/10 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                  DETAIL TRANSAKSI
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  transaction.order_status === 'BATAL'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {transaction.order_status}
                </span>
              </div>
              <h2 className="text-xl font-mono font-black text-text-main mt-1">
                {transaction.invoice_number}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-main">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 my-3 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-2 px-2.5 border-b-2 flex items-center gap-1 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Info & Item</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`py-2 px-2.5 border-b-2 flex items-center gap-1 transition-colors ${
                activeTab === 'materials'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bahan ({allMaterials.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-2.5 border-b-2 flex items-center gap-1 transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Kas ({transaction.payments?.length || 1})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`py-2 px-2.5 border-b-2 flex items-center gap-1 transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* TAB 1: INFO & ITEMS */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="py-2 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Waktu Pesanan:</span>
                  <span className="font-semibold text-text-main">
                    {new Date(transaction.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-text-muted">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Pelanggan:</span>
                  <span className="font-bold text-text-main">{transaction.customer_name || 'Pelanggan Umum'}</span>
                </div>

                <div className="flex items-center justify-between text-text-muted">
                  <span>Status Bayar:</span>
                  <span className={`font-bold uppercase ${
                    transaction.payment_status === 'PAID' ? 'text-emerald-600' : transaction.payment_status === 'DP' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {transaction.payment_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-text-muted">
                  <span>Metode Pembayaran:</span>
                  {(() => {
                    const pm = getPaymentMethod(transaction.payment_method);
                    const MethodIcon = pm.icon;
                    return (
                      <span className="font-bold text-text-main flex items-center gap-1.5">
                        <MethodIcon className="w-3.5 h-3.5" />
                        {pm.label}
                      </span>
                    );
                  })()}
                </div>

                {transaction.estimated_done_at && (
                  <div className="flex items-center justify-between text-text-muted">
                    <span>Estimasi Selesai:</span>
                    <span className="font-semibold text-text-main">{transaction.estimated_done_at}</span>
                  </div>
                )}
              </div>

              {/* Rincian Item */}
              <div className="border-t border-black/10 dark:border-white/10 pt-3">
                <h3 className="font-bold text-xs text-text-main mb-2.5">Daftar Item Pesanan:</h3>
                <div className="space-y-2">
                  {transaction.items && transaction.items.map((item: any) => {
                    const unitPrice = Number(item.price || item.custom_price || item.unit_price || 0);
                    const subtotal = item.subtotal ? Number(item.subtotal) : (unitPrice * item.qty);

                    return (
                      <div key={item.id} className="p-3 skeuo-inset rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                        <div className="flex justify-between font-bold text-text-main">
                          <span>{item.product_name || `Produk #${item.product_id}`} {item.variant_name ? `(${item.variant_name})` : ''}</span>
                          <span className="font-mono">{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>{item.qty} {item.unit_name || 'pcs'} @ {formatRupiah(unitPrice)}</span>
                          {(() => {
                            const isMeterItem = ((item.unit_name || '') + ' ' + (item.product_name || item.name || '')).toLowerCase().includes('meter');
                            return isMeterItem && item.length && item.width ? (
                              <span className="text-purple-600 dark:text-purple-400 font-mono font-semibold">
                                {item.length}m × {item.width}m ({((item.length || 1) * (item.width || 1)).toFixed(2)} m²)
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400">
                            Finishing: {item.addons.map((a: any) => a.addon_name || a).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-xl skeuo-inset bg-brand-50/40 dark:bg-brand-950/40 text-xs space-y-2 border border-brand-200/50 dark:border-brand-800/50">
                <div className="flex justify-between text-text-muted">
                  <span>Total Belanja:</span>
                  <span className="font-bold text-text-main">
                    {formatRupiah(transaction.total_amount)}
                  </span>
                </div>
                {Number(transaction.discount_amount) > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Diskon:</span>
                    <span>- {formatRupiah(transaction.discount_amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
                  <span>Dibayar Neto:</span>
                  <span className="font-mono">{formatRupiah(netPaid)}</span>
                </div>

                {remaining > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Sisa Piutang:</span>
                    <span className="font-mono">
                      {formatRupiah(remaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MATERIALS (SNAPSHOT BAHAN MANUAL) */}
          {activeTab === 'materials' && (
            <div className="space-y-3">
              {allMaterials.length === 0 ? (
                <div className="p-6 text-center bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">Tidak ada data bahan pada transaksi ini.</p>
                </div>
              ) : (
                allMaterials.map((mat, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {mat.product_name}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          {mat.material_name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {mat.source_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-950/60">
                        <span className="text-[9px] text-slate-400 block">Kebutuhan</span>
                        <span className="font-bold font-mono text-[11px] text-slate-700 dark:text-slate-200">
                          {mat.required_qty} {mat.unit}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/50">
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 block">Terkunci</span>
                        <span className="font-bold font-mono text-[11px] text-amber-700 dark:text-amber-300">
                          {mat.reserved_qty} {mat.unit}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/50">
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block">Terpakai</span>
                        <span className="font-bold font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                          {mat.consumed_qty} {mat.unit}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/50">
                        <span className="text-[9px] text-rose-600 dark:text-rose-400 block">Waste</span>
                        <span className="font-bold font-mono text-[11px] text-rose-700 dark:text-rose-300">
                          {mat.waste_qty} {mat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-2.5">
              {transaction.payments && transaction.payments.length > 0 ? (
                transaction.payments.map((p: any) => (
                  <div 
                    key={p.id} 
                    className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                      p.payment_type === 'REFUND' 
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                          p.payment_type === 'REFUND' 
                            ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {p.payment_type === 'REFUND' ? 'Refund' : 'Pembayaran'}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {p.payment_method}
                        </span>
                      </div>
                      {p.notes && <p className="text-[11px] text-slate-500 mt-1">{p.notes}</p>}
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
                ))
              ) : (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Pembayaran Saat Checkout:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatRupiah(netPaid)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {transaction.production_events && transaction.production_events.length > 0 ? (
                <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {transaction.production_events.map((ev: any, i: number) => (
                    <div key={ev.id || i} className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">
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
                <div className="p-6 text-center bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">Belum ada peristiwa produksi tercatat.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10 space-y-2">
          {transaction.order_status === 'BATAL' && netPaid > 0 && onRefund && (
            <button
              onClick={() => onRefund(transaction)}
              className="w-full py-2.5 font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Proses Refund ({formatRupiah(netPaid)})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
