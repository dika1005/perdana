'use client';

import React, { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Modal, Button, Field, Textarea } from '../shared';

interface CancelTransactionModalProps {
  transaction: any;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const CancelTransactionModal: React.FC<CancelTransactionModalProps> = ({
  transaction,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('Pelanggan membatalkan pesanan');
  const reasonValid = reason.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonValid) return;
    onSubmit(reason.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Batalkan Pesanan"
      subtitle={<>{transaction?.invoice_number} • <strong className="text-text-main">{transaction?.customer_name || 'Pelanggan Umum'}</strong></>}
      icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Kembali
          </Button>
          <Button variant="danger" type="submit" disabled={submitting || !reasonValid} className="flex-1">
            <Trash2 className="w-4 h-4" />
            {submitting ? 'Membatalkan...' : 'Ya, Batalkan'}
          </Button>
        </>
      }
    >
      <div className="p-3 rounded-xl text-xs mb-4 border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
        Pesanan masih mengantri: reservasi bahan akan dilepas sehingga stok kembali
        tersedia untuk pesanan lain. Uang yang sudah masuk (DP/lunas){' '}
        <strong>tidak otomatis direfund</strong> — proses refund dicatat terpisah
        melalui halaman Riwayat Transaksi.
      </div>

      <Field label="Alasan Pembatalan" required>
        <Textarea
          required
          minLength={2}
          maxLength={255}
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={2}
        />
      </Field>
    </Modal>
  );
};
