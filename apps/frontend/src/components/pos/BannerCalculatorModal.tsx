'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Check, Package } from 'lucide-react';
import { Product } from '../../types/product';
import { formatRupiah } from '../../utils/format';
import { CartItem } from './types';
import { isMeteranProduct } from '../../hooks/usePOSState';
import { Modal, Button, Field, Input, Select, EmptyState } from '../shared';

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
  const meteranProducts = products.filter(isMeteranProduct);

  const [calcSelectedProduct, setCalcSelectedProduct] = useState<Product | null>(null);
  const [calcLength, setCalcLength] = useState<number>(3);
  const [calcWidth, setCalcWidth] = useState<number>(1);
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcRatePerMeter, setCalcRatePerMeter] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const first = meteranProducts[0] || null;
      setCalcSelectedProduct(first);
      setCalcRatePerMeter(first ? Number(first.default_price) || 0 : 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (meteranProducts.length === 0) {
    return (
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Kalkulator Spanduk & Banner (m²)"
        icon={<Calculator className="w-4 h-4" />}
        footer={<Button className="flex-1" onClick={onClose}>Tutup</Button>}
      >
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="Belum ada produk meteran"
          description="Kalkulator ini membutuhkan produk dengan satuan meter. Tambahkan produk meteran terlebih dahulu di halaman Produk."
        />
      </Modal>
    );
  }

  const area = Math.round((calcLength * calcWidth) * 100) / 100;
  const unitPrice = Math.round(area * calcRatePerMeter);
  const totalCost = unitPrice * calcQty;
  const rateInvalid = calcRatePerMeter <= 0;

  const handleAdd = () => {
    if (!calcSelectedProduct || rateInvalid) return;
    onAddToCart({
      product: calcSelectedProduct,
      qty: calcQty,
      price: unitPrice,
      length: calcLength,
      width: calcWidth,
    });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Kalkulator Spanduk & Banner (m²)"
      subtitle="Hitung luas meter persegi dan total harga secara presisi."
      icon={<Calculator className="w-4 h-4" />}
      maxWidth="md"
      footer={
        <>
          <Button className="flex-1" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleAdd}
            disabled={!calcSelectedProduct || rateInvalid}
          >
            <Check className="w-4 h-4" />
            Tambahkan ke Keranjang
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Pilih Produk / Bahan Cetak">
          <Select
            value={calcSelectedProduct ? calcSelectedProduct.id : ''}
            onChange={e => {
              const found = meteranProducts.find(p => p.id === Number(e.target.value)) || null;
              setCalcSelectedProduct(found);
              setCalcRatePerMeter(found ? Number(found.default_price) || 0 : 0);
            }}
          >
            {meteranProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit_name}) - Default: {formatRupiah(p.default_price)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Panjang (Meter)">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={calcLength}
              onChange={e => setCalcLength(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            />
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCalcLength(v)}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all cursor-pointer ${
                    calcLength === v ? 'skeuo-inset text-brand-600 font-bold' : 'skeuo-button text-text-muted'
                  }`}
                >
                  {v}m
                </button>
              ))}
            </div>
          </Field>

          <Field label="Lebar (Meter)">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={calcWidth}
              onChange={e => setCalcWidth(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            />
            <div className="flex gap-1 mt-1.5">
              {[0.8, 1, 1.2, 1.5, 2].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCalcWidth(v)}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-all cursor-pointer ${
                    calcWidth === v ? 'skeuo-inset text-brand-600 font-bold' : 'skeuo-button text-text-muted'
                  }`}
                >
                  {v}m
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tarif per m² (Rp)">
            <Input
              type="number"
              min="0"
              step="1000"
              value={calcRatePerMeter}
              onChange={e => setCalcRatePerMeter(Math.max(0, parseInt(e.target.value) || 0))}
              className="font-bold text-brand-600"
            />
            {rateInvalid && (
              <p className="text-[11px] text-red-500 mt-1">
                Tarif belum diatur. Isi tarif per m² untuk produk ini.
              </p>
            )}
          </Field>

          <Field label="Jumlah (Qty Lembar)">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalcQty(Math.max(1, calcQty - 1))}
                className="w-8 h-8 flex items-center justify-center skeuo-button text-text-muted rounded-lg font-bold cursor-pointer"
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
                className="w-8 h-8 flex items-center justify-center skeuo-button text-text-muted rounded-lg font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </Field>
        </div>

        <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/40 dark:bg-brand-950/40 text-xs space-y-1.5 border border-brand-200/50 dark:border-brand-800/50">
          <div className="flex justify-between text-text-muted">
            <span>Ukuran Dimensi:</span>
            <span className="font-bold text-text-main">{calcLength} m × {calcWidth} m ({area} m²)</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Harga per Lembar:</span>
            <span className="font-bold">{formatRupiah(unitPrice)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Total Luas Cetak:</span>
            <span className="font-bold">{Math.round(area * calcQty * 100) / 100} m² ({calcQty} lembar)</span>
          </div>
          <div className="flex justify-between font-black text-sm text-brand-600 pt-2 border-t border-brand-200/50 dark:border-brand-800/50">
            <span>TOTAL BIAYA:</span>
            <span className="text-base">{formatRupiah(totalCost)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
