'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingCart, User, RefreshCw, X, Check } from 'lucide-react';
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
  const [successInvoice, setSuccessInvoice] = useState<any>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        productService.getProducts({ 
          search: searchTerm || undefined, 
          category_id: activeCategoryId 
        }),
        categoryService.getProductCategories(),
        customerService.getCustomers(),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
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
      setSuccessInvoice(result);
      setCart([]);
      setShowCheckoutModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal memproses transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-full pb-4">
        {/* Left: Product Catalog */}
        <div className="flex-1 flex flex-col h-full">
          <form onSubmit={handleSearch} className="mb-6 flex gap-4">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 skeuo-inset">
              <Search className="w-5 h-5 text-text-muted" />
              <input 
                type="text" 
                placeholder="Cari produk dari database..." 
                className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="px-5 py-3 font-bold skeuo-button text-text-main">
              Cari
            </button>
          </form>

          {/* Categories */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              onClick={() => setActiveCategoryId(undefined)}
              className={`px-5 py-2 whitespace-nowrap font-medium transition-all rounded-xl ${
                activeCategoryId === undefined 
                  ? 'skeuo-inset text-brand-600 font-bold' 
                  : 'skeuo-button text-text-muted hover:text-text-main'
              }`}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-5 py-2 whitespace-nowrap font-medium transition-all rounded-xl ${
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
              <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Memuat produk dari database...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-text-muted text-sm">
                Belum ada produk di database atau sesuai pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="skeuo-button p-4 flex flex-col items-center text-center group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl skeuo-inset mb-4 flex items-center justify-center bg-brand-50/50 group-hover:bg-brand-50 transition-colors">
                      <span className="text-2xl font-bold text-brand-500">{product.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-bold text-sm text-text-main mb-1 line-clamp-2 min-h-[40px]">{product.name}</h3>
                    <p className="text-brand-600 font-bold mt-auto">
                      Rp {Number(product.default_price).toLocaleString('id-ID')}
                    </p>
                    <span className="text-xs text-text-muted mt-1">/ {product.unit_name || 'pcs'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col skeuo p-6 shrink-0 h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/30">
            <h2 className="text-xl font-bold text-text-main">Keranjang Kasir</h2>
            <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-sm font-bold skeuo-inset">
              {cart.length} Item
            </span>
          </div>

          {/* Customer Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Pelanggan:
            </label>
            <select 
              value={selectedCustomer ? selectedCustomer.id : ''} 
              onChange={e => {
                const id = Number(e.target.value);
                const found = customers.find(c => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-3 py-2 text-sm skeuo font-medium text-text-main outline-none bg-transparent rounded-xl"
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
                className="w-full mt-2 px-3 py-2 text-xs skeuo-inset text-text-main outline-none rounded-lg"
              />
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p>Belum ada produk dipilih</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="skeuo-inset p-3 rounded-xl flex gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-text-main">{item.product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted">Harga:</span>
                      <input 
                        type="number" 
                        value={item.price}
                        onChange={e => updatePrice(item.product.id, Number(e.target.value))}
                        className="w-24 text-xs font-bold text-brand-600 bg-transparent border-b border-brand-300 outline-none"
                      />
                    </div>
                    <p className="text-brand-600 text-sm font-bold mt-1">
                      Subtotal: Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 mb-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 skeuo-sm rounded-lg p-1">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center skeuo-button rounded text-text-main">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center skeuo-button rounded text-text-main">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div className="pt-3 border-t border-white/30 mt-3 space-y-3">
            <div className="flex justify-between items-center text-base font-bold text-text-main">
              <span>Total Tagihan</span>
              <span className="text-xl text-brand-600">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            
            <button 
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl skeuo-button bg-brand-500 text-white shadow-none border-none hover:bg-brand-600 active:bg-brand-700 font-bold transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" /> Bayar / Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProcessTransaction} className="skeuo p-8 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-text-main">Pembayaran Transaksi</h2>
              <button type="button" onClick={() => setShowCheckoutModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl skeuo-inset bg-brand-50/50">
                <p className="text-xs text-text-muted">Total Tagihan:</p>
                <p className="text-2xl font-bold text-brand-600">Rp {total.toLocaleString('id-ID')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Status Pembayaran</label>
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
                <label className="block text-sm font-medium text-text-muted mb-1">Nominal yang Dibayar (Rp)</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="number" 
                    min="0"
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="bg-transparent border-none outline-none w-full text-text-main font-bold text-lg"
                  />
                </div>
                {payAmount > total && (
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    Kembalian: Rp {(payAmount - total).toLocaleString('id-ID')}
                  </p>
                )}
                {payAmount < total && (
                  <p className="text-xs text-amber-600 font-bold mt-1">
                    Sisa Piutang: Rp {(total - payAmount).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Estimasi Selesai (Opsional)</label>
                <div className="px-4 py-3 skeuo-inset">
                  <input 
                    type="date" 
                    value={estimatedDoneAt}
                    onChange={e => setEstimatedDoneAt(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-text-main"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 font-bold skeuo-button text-text-muted"
                disabled={submitting}
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 font-bold skeuo-button text-brand-600"
              >
                {submitting ? 'Memproses...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Modal */}
      {successInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full skeuo-inset mx-auto flex items-center justify-center text-emerald-500 mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-1">Transaksi Berhasil!</h2>
            <p className="text-sm text-text-muted mb-6">
              No. Invoice: <strong className="text-text-main">{successInvoice.invoice_number}</strong>
            </p>
            <button 
              onClick={() => setSuccessInvoice(null)}
              className="w-full py-3 font-bold skeuo-button text-brand-600"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
