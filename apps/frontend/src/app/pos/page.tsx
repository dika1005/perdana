'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  ShoppingCart, 
  User, 
  RefreshCw, 
  X, 
  Check, 
  Printer, 
  Calculator 
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { customerService } from '../../services/customerService';
import { transactionService } from '../../services/transactionService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { Customer } from '../../types/customer';
import { PaymentStatus } from '../../types/transaction';

interface CartItem {
  product: Product;
  qty: number;
  price: number;
  length?: number;
  width?: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout modal / state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [estimatedDoneAt, setEstimatedDoneAt] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        productService.getProducts({ 
          search: searchTerm || undefined, 
          category_id: activeCategoryId 
        }),
        productService.getCategories(),
        customerService.getCustomers(),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes);
      setCustomers(custRes.data);
    } catch (err: any) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [activeCategoryId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const addToCart = (product: Product) => {
    const defaultPrice = Number(product.default_price) || 0;
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { product, qty: product.min_order || 1, price: defaultPrice }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const updatePrice = (id: number, price: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        return { ...item, price };
      }
      return item;
    }));
  };

  const updateDimensions = (id: number, length: number, width: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const area = (length > 0 && width > 0) ? (length * width) : 1;
        const baseRate = Number(item.product.default_price) || item.price;
        return { ...item, length, width, price: Math.round(baseRate * area) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPayAmount(total);
    setShowCheckoutModal(true);
  };

  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : undefined,
        customer_name: selectedCustomer ? selectedCustomer.name : (customCustomerName.trim() || 'Umum'),
        discount_amount: discountAmount > 0 ? discountAmount : undefined,
        pay_amount: payAmount,
        payment_status: paymentStatus,
        estimated_done_at: estimatedDoneAt || undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          custom_price: item.price,
          qty: item.qty,
        })),
      };

      const result = await transactionService.createTransaction(payload);
      
      // Fetch full printable invoice data
      try {
        const inv = await transactionService.getInvoiceData(result.id);
        setInvoiceData(inv);
      } catch {
        setInvoiceData(result);
      }

      setCart([]);
      setShowCheckoutModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memproses transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-full pb-4">
        {/* Left: Product Catalog */}
        <div className="flex-1 flex flex-col h-full">
          <form onSubmit={handleSearch} className="mb-4 flex gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl">
              <Search className="w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari produk kasir..." 
                className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="px-5 py-2.5 font-bold skeuo-button text-text-main text-xs">
              Cari
            </button>
          </form>

          {/* Categories */}
          <div className="flex gap-2.5 mb-4 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              onClick={() => setActiveCategoryId(undefined)}
              className={`px-4 py-2 whitespace-nowrap font-medium transition-all text-xs rounded-xl ${
                activeCategoryId === undefined 
                  ? 'skeuo-inset text-brand-600 font-bold' 
                  : 'skeuo-button text-text-muted hover:text-text-main'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2 whitespace-nowrap font-medium transition-all text-xs rounded-xl ${
                  activeCategoryId === cat.id 
                    ? 'skeuo-inset text-brand-600 font-bold' 
                    : 'skeuo-button text-text-muted hover:text-text-main'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-text-muted text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Memuat produk...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-text-muted text-xs">
                Belum ada produk sesuai pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {products.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="skeuo-button p-3.5 flex flex-col items-center text-center group cursor-pointer text-xs"
                  >
                    <div className="w-12 h-12 rounded-xl skeuo-inset mb-3 flex items-center justify-center bg-brand-50/50 group-hover:bg-brand-50 transition-colors">
                      <span className="text-xl font-bold text-brand-500">{product.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-bold text-xs text-text-main mb-1 line-clamp-2 min-h-[32px]">{product.name}</h3>
                    <p className="text-brand-600 font-bold mt-auto text-xs">
                      Rp {Number(product.default_price).toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-text-muted mt-0.5">/ {product.unit_name || 'pcs'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col skeuo p-5 shrink-0 h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-black/5 dark:border-white/10">
            <h2 className="text-base font-bold text-text-main">Keranjang Kasir</h2>
            <span className="bg-brand-100 text-brand-600 px-2.5 py-0.5 rounded-full text-xs font-bold skeuo-inset">
              {cart.length} Item
            </span>
          </div>

          {/* Customer Selection */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-text-muted mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Pelanggan:
            </label>
            <select 
              value={selectedCustomer ? selectedCustomer.id : ''} 
              onChange={e => {
                const id = Number(e.target.value);
                const found = customers.find(c => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-3 py-2 text-xs skeuo font-medium text-text-main outline-none bg-transparent rounded-xl"
            >
              <option value="">Pelanggan Umum (Tanpa Akun)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
            {!selectedCustomer && (
              <input 
                type="text" 
                placeholder="Nama Pelanggan (Manual)..." 
                value={customCustomerName}
                onChange={e => setCustomCustomerName(e.target.value)}
                className="w-full mt-1.5 px-3 py-1.5 text-xs skeuo-inset text-text-main outline-none rounded-lg"
              />
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 text-xs">
                <ShoppingCart className="w-10 h-10 mb-2" />
                <p>Belum ada produk dipilih</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="skeuo-inset p-3 rounded-xl flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-text-main">{item.product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-text-muted">Harga:</span>
                        <input 
                          type="number" 
                          value={item.price}
                          onChange={e => updatePrice(item.product.id, Number(e.target.value))}
                          className="w-20 text-xs font-bold text-brand-600 bg-transparent border-b border-brand-300 outline-none"
                        />
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Kalkulator Meteran Spanduk / Banner (Jika satuan meter/m2) */}
                  {(item.product.unit_name?.toLowerCase().includes('meter') || item.product.name.toLowerCase().includes('banner') || item.product.name.toLowerCase().includes('spanduk')) && (
                    <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 flex items-center gap-1.5 text-[10px] text-text-muted">
                      <Calculator className="w-3 h-3 text-brand-500" />
                      <span>Ukuran (P×L):</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="P (m)"
                        value={item.length || ''}
                        onChange={e => updateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                        className="w-12 px-1 py-0.5 skeuo-inset text-center text-text-main font-bold outline-none rounded"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="L (m)"
                        value={item.width || ''}
                        onChange={e => updateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                        className="w-12 px-1 py-0.5 skeuo-inset text-center text-text-main font-bold outline-none rounded"
                      />
                      <span className="font-semibold text-brand-600">
                        = {((item.length || 1) * (item.width || 1)).toFixed(1)} m²
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-black/5">
                    <span className="font-bold text-brand-600">
                      Subtotal: Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center gap-1.5 skeuo-sm rounded-lg p-1">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-5 h-5 flex items-center justify-center skeuo-button rounded text-text-main">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-5 h-5 flex items-center justify-center skeuo-button rounded text-text-main">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div className="pt-3 border-t border-black/5 dark:border-white/10 mt-2 space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-main">
              <span>Total Tagihan</span>
              <span className="text-lg text-brand-600 font-bold">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            
            <button 
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl skeuo-button bg-brand-500 text-white shadow-none border-none hover:bg-brand-600 active:bg-brand-700 font-bold text-sm transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" /> Bayar / Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProcessTransaction} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-text-main">Pembayaran Transaksi</h2>
              <button type="button" onClick={() => setShowCheckoutModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl skeuo-inset bg-brand-50/50">
                <p className="text-[11px] text-text-muted">Total Tagihan:</p>
                <p className="text-2xl font-bold text-brand-600">Rp {total.toLocaleString('id-ID')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Status Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAID', 'DP', 'UNPAID'] as PaymentStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(st);
                        if (st === 'PAID') setPayAmount(total);
                        if (st === 'UNPAID') setPayAmount(0);
                      }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        paymentStatus === st ? 'skeuo-inset text-brand-600' : 'skeuo-button text-text-muted'
                      }`}
                    >
                      {st === 'PAID' ? 'Lunas' : st === 'DP' ? 'DP' : 'Belum Bayar'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Nominal yang Dibayar (Rp)</label>
                <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                  <input 
                    type="number" 
                    min="0"
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="bg-transparent border-none outline-none w-full text-text-main font-bold text-base"
                  />
                </div>
                {payAmount > total && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    Kembalian: Rp {(payAmount - total).toLocaleString('id-ID')}
                  </p>
                )}
                {payAmount < total && (
                  <p className="text-[11px] text-amber-600 font-bold mt-1">
                    Sisa Piutang: Rp {(total - payAmount).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Estimasi Selesai (Opsional)</label>
                <div className="px-4 py-2.5 skeuo-inset rounded-xl">
                  <input 
                    type="date" 
                    value={estimatedDoneAt}
                    onChange={e => setEstimatedDoneAt(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-xs text-text-main"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
                disabled={submitting}
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold skeuo-button text-brand-600 text-xs"
              >
                {submitting ? 'Memproses...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Modal with Printable Thermal Slip */}
      {invoiceData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/10">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> Transaksi Berhasil!
              </h3>
              <button onClick={() => setInvoiceData(null)} className="text-text-muted hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Preview */}
            <div className="bg-white text-black p-4 font-mono text-[11px] leading-tight rounded-lg shadow-inner mb-4 space-y-2 border border-slate-300">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <p className="font-bold text-sm">{invoiceData.store_name || 'PERDANA PERCETAKAN'}</p>
                <p className="text-[10px] text-slate-600">{invoiceData.store_address || 'Jl. Raya Percetakan No. 88'}</p>
                <p className="text-[10px] text-slate-600">WA: {invoiceData.store_phone || '0812-3456-7890'}</p>
              </div>

              <div className="py-1 text-[10px] text-slate-700 space-y-0.5">
                <div className="flex justify-between">
                  <span>No: {invoiceData.invoice_number}</span>
                  <span>{new Date(invoiceData.date || invoiceData.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir: {invoiceData.cashier_name || 'Admin Kasir'}</span>
                  <span>Plg: {invoiceData.customer_name}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Status: {invoiceData.payment_status}</span>
                  <span>Order: {invoiceData.order_status || 'ANTRIAN'}</span>
                </div>
              </div>

              <div className="py-2 border-y border-dashed border-slate-400 space-y-1.5">
                {invoiceData.items?.map((it: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between font-semibold">
                      <span>{it.product_name} × {it.qty}</span>
                      <span>Rp {Number(it.subtotal || it.price * it.qty).toLocaleString('id-ID')}</span>
                    </div>
                    {it.addons?.map((ad: any, aI: number) => (
                      <div key={aI} className="flex justify-between text-[10px] text-slate-500 pl-2">
                        <span>+ {ad.addon_name}</span>
                        <span>Rp {Number(ad.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="pt-1 text-[10px] space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {Number(invoiceData.subtotal_amount || invoiceData.total_amount).toLocaleString('id-ID')}</span>
                </div>
                {Number(invoiceData.discount_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Diskon</span>
                    <span>- Rp {Number(invoiceData.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL</span>
                  <span>Rp {Number(invoiceData.total_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>BAYAR</span>
                  <span>Rp {Number(invoiceData.pay_amount).toLocaleString('id-ID')}</span>
                </div>
                {Number(invoiceData.remaining_amount) > 0 ? (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>SISA PIUTANG</span>
                    <span>Rp {Number(invoiceData.remaining_amount).toLocaleString('id-ID')}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>KEMBALI</span>
                    <span>Rp {Number(invoiceData.change_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2.5 border-t border-dashed border-slate-400 text-[9px] text-slate-500">
                <p>Terima kasih atas pesanan Anda!</p>
                <p>Simpan nota ini untuk pengambilan barang.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setInvoiceData(null)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
              >
                Selesai
              </button>
              <button 
                onClick={triggerBrowserPrint}
                className="flex-1 py-2.5 font-bold skeuo-button bg-brand-500 text-white shadow-none border-none hover:bg-brand-600 text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
