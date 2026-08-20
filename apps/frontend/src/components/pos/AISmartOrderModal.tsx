'use client';

import React, { useState } from 'react';
import { Sparkles, X, AlertCircle, RefreshCw, Layers, Check } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Product } from '../../types/product';
import { ParseOrderResponse } from '../../types/ai';
import { CartItem } from './types';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-7 w-full max-w-lg bg-bg-skeuo max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-black/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-brand-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">AI Smart Order (Parser WhatsApp)</h3>
              <p className="text-[10px] text-text-muted">Ekstrak otomatis item pesanan, dimensi meteran, dan nama pemesan.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setAiResult(null);
              setAiError(null);
              onClose();
            }} 
            className="text-text-muted hover:text-text-main"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Tempel (Paste) Chat WhatsApp / Catatan Pesanan Bebas:
            </label>
            <textarea
              rows={4}
              placeholder={`Contoh:\n"Halo mas, mau pesan spanduk 3x1.5m 2 biji mata ayam tiap sudut, sama cetak brosur A5 500 lbr atas nama Budi"`}
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              className="w-full p-3 skeuo-inset text-xs text-text-main outline-none rounded-xl resize-none font-sans bg-white/40 dark:bg-black/20 border border-black/10"
            />
          </div>

          {/* Template Buttons */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-text-muted">Coba Contoh Template:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAiText('Halo mas, pesan spanduk 3x1 meter 2 lembar bahan flexi, sama cetak kartu nama 2 box atas nama Budi')}
                className="px-2 py-1 text-[10px] skeuo-button text-brand-600 rounded-lg hover:bg-brand-50"
              >
                Contoh: Spanduk + Kartu Nama
              </button>
              <button
                type="button"
                onClick={() => setAiText('Order banner 2x3m 1 pcs finishing mata ayam sudut')}
                className="px-2 py-1 text-[10px] skeuo-button text-brand-600 rounded-lg hover:bg-brand-50"
              >
                Contoh: Banner Finishing
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={parsingAI || !aiText.trim()}
              className="px-5 py-2.5 font-bold rounded-xl bg-gradient-to-r from-amber-500 to-brand-600 text-white text-xs flex items-center gap-1.5 shadow-md hover:from-amber-600 hover:to-brand-700 disabled:opacity-50"
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
            </button>
          </div>
        </form>

        {/* AI Extracted Result Preview */}
        {aiResult && (
          <div className="mt-4 pt-3 border-t border-black/10 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-text-main flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" /> Hasil Deteksi AI:
              </h4>
              {aiResult.customer_name_hint && (
                <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-bold">
                  Nama: {aiResult.customer_name_hint}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {aiResult.items.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl skeuo-inset bg-white/50 dark:bg-black/30 text-xs flex justify-between items-center">
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
              <button
                type="button"
                onClick={() => setAiResult(null)}
                className="flex-1 py-2 font-bold skeuo-button text-text-muted text-xs rounded-xl"
              >
                Ulangi
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2 font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Masukkan ke Keranjang ({aiResult.items.length} Item)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
