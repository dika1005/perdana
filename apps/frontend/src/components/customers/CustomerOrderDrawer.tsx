'use client';

import React from 'react';
import { History, X } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CustomerOrderDrawerProps {
  customer: Customer | null;
  orders: any[];
  loading: boolean;
  onClose: () => void;
}

export const CustomerOrderDrawer: React.FC<CustomerOrderDrawerProps> = ({
  customer,
  orders,
  loading,
  onClose,
}) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
      <div className="w-full max-w-md bg-bg-skeuo h-full p-6 shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-black/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
              Profil Pelanggan
            </span>
            <h2 className="text-xl font-bold text-text-main mt-1">{customer.name}</h2>
            <p className="text-xs text-text-muted">{customer.phone || 'Tanpa No. HP'}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
              <History className="w-4 h-4 text-brand-500" />
              Riwayat Nota Belanja ({orders.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Memuat riwayat nota pelanggan...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Belum ada riwayat transaksi untuk pelanggan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(ord => (
                <div key={ord.id} className="p-4 rounded-xl skeuo-inset text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-text-main font-mono">{ord.invoice_number}</span>
                    <span className="text-brand-600">Rp {Number(ord.total_amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-text-muted text-[11px]">
                    <span>{new Date(ord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold text-slate-700">{ord.order_status}</span>
                  </div>
                  <div className="pt-1 border-t border-black/5 flex justify-between items-center text-[10px]">
                    <span className={`font-bold ${ord.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Status: {ord.payment_status}
                    </span>
                    {Number(ord.total_amount) > Number(ord.pay_amount) && (
                      <span className="text-red-500 font-bold">
                        Sisa DP: Rp {(Number(ord.total_amount) - Number(ord.pay_amount)).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-black/10 mt-auto">
          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold skeuo-button text-text-main text-xs"
          >
            Tutup Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
