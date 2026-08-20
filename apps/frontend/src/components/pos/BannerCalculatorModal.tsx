'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, X, Check } from 'lucide-react';
import { Product } from '../../types/product';
import { CartItem } from './types';

interface BannerCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (item: CartItem) => void;
}

export const BannerCalculatorModal: React.FC<BannerCalculatorModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
}) => {
  const [calcSelectedProduct, setCalcSelectedProduct] = useState<Product | null>(null);
  const [calcLength, setCalcLength] = useState<number>(3);
  const [calcWidth, setCalcWidth] = useState<number>(1);
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcRatePerMeter, setCalcRatePerMeter] = useState<number>(25000);

  useEffect(() => {
    if (isOpen) {
      const bannerProd = products.find(p => 
        p.name.toLowerCase().includes('spanduk') || 
        p.name.toLowerCase().includes('banner') || 
        p.unit_name === 'meter' || 
        p.price_type === 'CUSTOM'
      ) || products[0] || null;
      setCalcSelectedProduct(bannerProd);
      if (bannerProd) {
        setCalcRatePerMeter(Number(bannerProd.default_price) || 25000);
      }
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const area = Math.round((calcLength * calcWidth) * 100) / 100;
  const unitPrice = Math.round(area * calcRatePerMeter);
  const totalCost = unitPrice * calcQty;

  const handleAdd = () => {
    const targetProd = calcSelectedProduct || products[0];
    if (!targetProd) return;

    onAddToCart({
      product: targetProd,
      qty: calcQty,
      price: unitPrice,
      length: calcLength,
      width: calcWidth
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="skeuo p-6 sm:p-7 w-full max-w-lg bg-bg-skeuo">
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg skeuo-inset flex items-center justify-center text-brand-600 bg-brand-50">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Kalkulator Spanduk & Banner (m²)</h3>
              <p className="text-[10px] text-text-muted">Hitung luas meter persegi dan total harga secara presisi.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Pilih Bahan / Produk */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Pilih Produk / Bahan Cetak:
            </label>
            <select
              value={calcSelectedProduct ? calcSelectedProduct.id : ''}
              onChange={e => {
                const prodId = Number(e.target.value);
                const found = products.find(p => p.id === prodId) || null;
                setCalcSelectedProduct(found);
                if (found) {
                  setCalcRatePerMeter(Number(found.default_price) || 25000);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl skeuo-inset text-xs text-text-main outline-none bg-transparent"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit_name}) - Default: Rp {Number(p.default_price).toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Dimensi: Panjang x Lebar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Panjang (Meter):
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={calcLength}
                onChange={e => setCalcLength(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full px-3.5 py-2 rounded-xl skeuo-inset text-sm font-bold text-text-main outline-none bg-transparent"
              />
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCalcLength(v)}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all ${
                      calcLength === v ? 'skeuo-inset text-brand-600 font-bold' : 'skeuo-button text-text-muted'
                    }`}
                  >
                    {v}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Lebar (Meter):
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={calcWidth}
                onChange={e => setCalcWidth(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full px-3.5 py-2 rounded-xl skeuo-inset text-sm font-bold text-text-main outline-none bg-transparent"
              />
              <div className="flex gap-1 mt-1.5">
                {[0.8, 1, 1.2, 1.5, 2].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCalcWidth(v)}
                    className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all ${
                      calcWidth === v ? 'skeuo-inset text-brand-600 font-bold' : 'skeuo-button text-text-muted'
                    }`}
                  >
                    {v}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Tarif & Qty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Tarif per m² (Rp):
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={calcRatePerMeter}
                onChange={e => setCalcRatePerMeter(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2 rounded-xl skeuo-inset text-xs font-bold text-brand-600 outline-none bg-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">
                Jumlah (Qty Lembar):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalcQty(Math.max(1, calcQty - 1))}
                  className="w-8 h-8 flex items-center justify-center skeuo-button text-text-muted rounded-lg font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={calcQty}
                  onChange={e => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center py-1.5 skeuo-inset text-xs font-bold text-text-main rounded-lg outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setCalcQty(calcQty + 1)}
                  className="w-8 h-8 flex items-center justify-center skeuo-button text-text-muted rounded-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Summary Card */}
          <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/40 text-xs space-y-1.5 border border-brand-200/50">
            <div className="flex justify-between text-text-muted">
              <span>Ukuran Dimensi:</span>
              <span className="font-bold text-text-main">{calcLength} m × {calcWidth} m ({area} m²)</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Harga per Lembar:</span>
              <span className="font-bold">Rp {unitPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Total Luas Cetak:</span>
              <span className="font-bold">{Math.round(area * calcQty * 100) / 100} m² ({calcQty} lembar)</span>
            </div>
            <div className="flex justify-between font-black text-sm text-brand-600 pt-2 border-t border-black/5">
              <span>TOTAL BIAYA:</span>
              <span className="text-base">Rp {totalCost.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2.5 font-bold skeuo-button-primary bg-brand-500 hover:bg-brand-600 text-white text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Tambahkan ke Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
