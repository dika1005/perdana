'use client';

import React, { useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw, Layers, Check } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Product } from '../../types/product';
import { ParseOrderResponse } from '../../types/ai';
import { CartItem } from './types';
import { Modal, Button, Field, Textarea } from '../shared';

interface AISmartOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyItems: (items: CartItem[], customerNameHint?: string) => void;
}

export const AISmartOrderModal: React.FC<AISmartOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  onApplyItems,
}) => {
  const [aiText, setAiText] = useState('');
  const [parsingAI, setParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<ParseOrderResponse | null>(null);

  const handleClose = () => {
    setAiResult(null);
    setAiError(null);
    onClose();
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim()) return;
    setParsingAI(true);
    setAiError(null);
    try {
      const res = await aiService.parseOrder(aiText);
      setAiResult(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menganalisis pesanan dengan AI. Periksa koneksi atau model API.';
      setAiError(msg);
    } finally {
      setParsingAI(false);
    }
  };

  const handleApply = () => {
    if (!aiResult || !aiResult.items || aiResult.items.length === 0) return;

    const extractedCartItems: CartItem[] = [];

    for (const item of aiResult.items) {
      let targetProduct: Product | undefined;
      if (item.product_id) {
        targetProduct = products.find(p => p.id === item.product_id);
      }
      if (!targetProduct) {
        targetProduct = products.find(p =>
          p.name.toLowerCase().includes(item.product_name.toLowerCase()) ||
          item.product_name.toLowerCase().includes(p.name.toLowerCase())
        );
      }

      if (targetProduct) {
        const baseRate = Number(targetProduct.default_price) || 0;
        const area = (item.length && item.width && item.length > 0 && item.width > 0) ? (item.length * item.width) : 1;
        const finalPrice = Math.round(baseRate * area);

        extractedCartItems.push({
          product: targetProduct,
          qty: item.qty || 1,
          price: finalPrice > 0 ? finalPrice : baseRate,
          length: item.length || undefined,
          width: item.width || undefined,
        });
      }
    }

    onApplyItems(extractedCartItems, aiResult.customer_name_hint || undefined);
    setAiText('');
    setAiResult(null);
    setAiError(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="AI Smart Order (Parser WhatsApp)"
      subtitle="Ekstrak otomatis item pesanan, dimensi meteran, dan nama pemesan."
      icon={<Sparkles className="w-4 h-4" />}
      maxWidth="md"
    >
      {aiError && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Gagal Ekstrak AI:</p>
            <p className="text-[11px] opacity-90">{aiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleParse} className="space-y-3">
        <Field label="Tempel (Paste) Chat WhatsApp / Catatan Pesanan Bebas">
          <Textarea
            rows={4}
            placeholder={`Contoh:\n"Halo mas, mau pesan spanduk 3x1.5m 2 biji mata ayam tiap sudut, sama cetak brosur A5 500 lbr atas nama Budi"`}
            value={aiText}
            onChange={e => setAiText(e.target.value)}
          />
        </Field>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-text-muted">Coba Contoh Template:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setAiText('Halo mas, pesan spanduk 3x1 meter 2 lembar bahan flexi, sama cetak kartu nama 2 box atas nama Budi')}
              className="px-2 py-1 text-[10px] skeuo-button text-brand-600 rounded-lg hover:bg-brand-50 cursor-pointer"
            >
              Contoh: Spanduk + Kartu Nama
            </button>
            <button
              type="button"
              onClick={() => setAiText('Order banner 2x3m 1 pcs finishing mata ayam sudut')}
              className="px-2 py-1 text-[10px] skeuo-button text-brand-600 rounded-lg hover:bg-brand-50 cursor-pointer"
            >
              Contoh: Banner Finishing
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            type="submit"
            disabled={parsingAI || !aiText.trim()}
          >
            {parsingAI ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Menganalisis Pesanan...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Ekstrak Pesanan Otomatis
              </>
            )}
          </Button>
        </div>
      </form>

      {aiResult && (
        <div className="mt-4 pt-3 border-t border-border-main space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs text-text-main flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-600" /> Hasil Deteksi AI:
            </h4>
            {aiResult.customer_name_hint && (
              <span className="text-[10px] bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded font-bold">
                Nama: {aiResult.customer_name_hint}
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {aiResult.items.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl skeuo-inset text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold text-text-main">{item.product_name}</p>
                  <p className="text-[10px] text-text-muted">
                    Qty: <strong>{item.qty}</strong>
                    {item.length && item.width ? ` • Ukuran: ${item.length}m × ${item.width}m (${item.length * item.width} m²)` : ''}
                    {item.notes ? ` • ${item.notes}` : ''}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  Terdeteksi
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => setAiResult(null)}>Ulangi</Button>
            <Button variant="primary" className="flex-1" onClick={handleApply}>
              <Check className="w-3.5 h-3.5" />
              Masukkan ke Keranjang ({aiResult.items.length} Item)
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
