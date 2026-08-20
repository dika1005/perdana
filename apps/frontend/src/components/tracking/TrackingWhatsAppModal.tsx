'use client';

import React from 'react';
import { X, MessageSquare, Phone, ExternalLink } from 'lucide-react';

interface TrackingWhatsAppModalProps {
  isOpen: boolean;
  job: any | null;
  phone: string;
  onPhoneChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const TrackingWhatsAppModal: React.FC<TrackingWhatsAppModalProps> = ({
  isOpen,
  job,
  phone,
  onPhoneChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-7 w-full max-w-sm bg-bg-skeuo">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-black/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Kirim Notifikasi WhatsApp</h3>
              <p className="text-[10px] text-text-muted font-mono">{job.invoice_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-text-muted">
            Pesanan atas nama <strong>{job.customer_name || 'Pelanggan'}</strong> belum memiliki nomor telepon. Masukkan nomor WhatsApp tujuan:
          </p>

          <div>
            <label className="block text-[11px] font-bold text-text-main mb-1">
              Nomor WhatsApp Pelanggan:
            </label>
            <div className="flex items-center gap-2 px-3 py-2 skeuo-inset rounded-xl">
              <Phone className="w-4 h-4 text-emerald-500" />
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={e => onPhoneChange(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs text-text-main font-mono"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 font-bold skeuo-button text-text-muted text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!phone.trim()}
              onClick={onSubmit}
              className="flex-1 py-2 font-bold bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
