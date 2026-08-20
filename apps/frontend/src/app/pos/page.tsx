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
  Calculator,
  Sparkles,
  Layers,
  Banknote,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { transactionService } from '../../services/transactionService';
import { aiService } from '../../services/aiService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { Customer } from '../../types/customer';
import { PaymentStatus } from '../../types/transaction';
import { ParseOrderResponse } from '../../types/ai';

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

  // AI Smart Order State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsingAI, setParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<ParseOrderResponse | null>(null);

  // Banner / Spanduk Calculator Modal State
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcSelectedProduct, setCalcSelectedProduct] = useState<Product | null>(null);
  const [calcLength, setCalcLength] = useState<number>(3);
  const [calcWidth, setCalcWidth] = useState<number>(1);
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcRatePerMeter, setCalcRatePerMeter] = useState<number>(25000);


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
      setCart([...cart, { 
        product, 
        qty: product.min_order || 1, 
        price: defaultPrice,
        length: 1,
        width: 1
      }]);
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
        const safeLength = length > 0 ? length : 1;
        const safeWidth = width > 0 ? width : 1;
        const area = safeLength * safeWidth;
        const baseRate = Number(item.product.default_price) || item.price;
        return { ...item, length: safeLength, width: safeWidth, price: Math.round(baseRate * area) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan semua item di keranjang?')) {
      setCart([]);
    }
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

  const handleParseAIOrder = async (e: React.FormEvent) => {
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

  const handleApplyAIItems = () => {
    if (!aiResult || !aiResult.items || aiResult.items.length === 0) return;

    let updatedCart = [...cart];

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
        const existingIndex = updatedCart.findIndex(c => c.product.id === targetProduct!.id);

        if (existingIndex > -1) {
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            qty: updatedCart[existingIndex].qty + item.qty,
            length: item.length || updatedCart[existingIndex].length,
            width: item.width || updatedCart[existingIndex].width,
            price: finalPrice > 0 ? finalPrice : updatedCart[existingIndex].price,
          };
        } else {
          updatedCart.push({
            product: targetProduct,
            qty: item.qty || 1,
            price: finalPrice > 0 ? finalPrice : baseRate,
            length: item.length || undefined,
            width: item.width || undefined,
          });
        }
      }
    }

    if (aiResult.customer_name_hint && !selectedCustomer) {
      setCustomCustomerName(aiResult.customer_name_hint);
    }

    setCart(updatedCart);
    setShowAIModal(false);
    setAiText('');
    setAiResult(null);
    setAiError(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-5 h-full pb-4">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: KATALOG PRODUK & SEARCH */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          
          {/* Top Bar: Search & AI Smart Order CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 skeuo-inset rounded-xl bg-white/50 dark:bg-black/20">
                <Search className="w-4 h-4 text-text-muted shrink-0" />
                <input 
                  type="text" 
                  placeholder="Ketik nama produk cetak (contoh: Spanduk, Kartu Nama, Brosur)..." 
                  className="bg-transparent border-none outline-none w-full text-xs text-text-main placeholder:text-text-muted/70"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} className="text-text-muted hover:text-text-main">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button type="submit" className="px-5 py-2.5 font-bold skeuo-button text-text-main text-xs shrink-0">
                Cari
              </button>
            </form>

            {/* Banner Calculator Trigger Button */}
            <button 
              type="button" 
              onClick={() => {
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
                setShowCalcModal(true);
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 font-bold rounded-xl bg-gradient-to-r from-blue-500/15 via-brand-500/15 to-emerald-500/15 border border-blue-500/30 text-brand-600 dark:text-brand-300 text-xs hover:shadow-md transition-all shrink-0"
              title="Hitung harga spanduk / banner meteran (P x L x Tarif per m2)"
            >
              <Calculator className="w-4 h-4 text-brand-500" />
              <span>📐 Kalkulator Banner (m²)</span>
            </button>

            {/* AI Smart Order Trigger Button */}
            <button 
              type="button" 
              onClick={() => {
                setShowAIModal(true);
                setAiError(null);
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 font-bold rounded-xl bg-gradient-to-r from-amber-500/15 via-brand-500/15 to-purple-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs hover:shadow-md transition-all shrink-0"
              title="Paste teks WhatsApp pesanan dan biarkan AI mengisi otomatis"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>✨ AI Smart Order</span>
            </button>
          </div>


          {/* Category Filter Pills */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1.5 custom-scrollbar">
            <button 
              onClick={() => setActiveCategoryId(undefined)}
              className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all ${
                activeCategoryId === undefined 
                  ? 'skeuo-inset text-brand-600 font-bold bg-brand-50/50' 
                  : 'skeuo-button text-text-muted hover:text-text-main'
              }`}
            >
              Semua Kategori ({products.length})
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold rounded-xl transition-all ${
                  activeCategoryId === cat.id 
                    ? 'skeuo-inset text-brand-600 font-bold bg-brand-50/50' 
                    : 'skeuo-button text-text-muted hover:text-text-main'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-muted text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-brand-500" />
                <p>Memuat katalog produk...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-text-muted text-xs skeuo p-8">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold">Tidak ada produk ditemukan</p>
                <p className="text-[11px] mt-1">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map(product => {
                  const inCartItem = cart.find(c => c.product.id === product.id);
                  const isCustom = product.price_type === 'CUSTOM' || product.unit_name?.toLowerCase().includes('meter');

                  return (
                    <div 
                      key={product.id} 
                      onClick={() => addToCart(product)}
                      className={`skeuo-button p-3.5 flex flex-col justify-between text-left group cursor-pointer transition-all relative ${
                        inCartItem ? 'border-brand-500/60 ring-2 ring-brand-500/20' : ''
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-brand-600 text-white font-bold text-[10px] shadow-sm">
                          ×{inCartItem.qty}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg skeuo-inset flex items-center justify-center font-bold text-brand-600 text-xs bg-brand-50/50">
                            {product.name.charAt(0)}
                          </div>
                          {isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              Ukuran P×L
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-xs text-text-main line-clamp-2 min-h-[32px] group-hover:text-brand-600 transition-colors">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-end justify-between">
                        <div>
                          <p className="text-brand-600 font-extrabold text-xs">
                            Rp {Number(product.default_price).toLocaleString('id-ID')}
                          </p>
                          <span className="text-[10px] text-text-muted">/ {product.unit_name || 'pcs'}</span>
                        </div>
                        <div className="w-6 h-6 rounded-lg skeuo-sm flex items-center justify-center text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: KERANJANG KASIR & CHECKOUT */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[420px] flex flex-col skeuo p-4 shrink-0 h-[calc(100vh-140px)] bg-bg-skeuo">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-text-main">Keranjang Kasir</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full text-xs font-bold skeuo-inset">
                {cart.length} Produk
              </span>
              {cart.length > 0 && (
                <button 
                  type="button"
                  onClick={clearCart} 
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium ml-1"
                  title="Kosongkan keranjang"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* Customer Selector Box */}
          <div className="my-3 p-3 rounded-xl skeuo-inset bg-white/40 dark:bg-black/20 text-xs">
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3 text-brand-500" /> Data Pemesan:
            </label>
            <select 
              value={selectedCustomer ? selectedCustomer.id : ''} 
              onChange={e => {
                const id = Number(e.target.value);
                const found = customers.find(c => c.id === id);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-medium text-text-main outline-none bg-transparent rounded-lg border border-black/10 dark:border-white/10"
            >
              <option value="">Pelanggan Umum (Ketik Bebas)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
            {!selectedCustomer && (
              <input 
                type="text" 
                placeholder="Nama Pembeli (opsional, default: Umum)..." 
                value={customCustomerName}
                onChange={e => setCustomCustomerName(e.target.value)}
                className="w-full mt-2 px-2.5 py-1.5 text-xs text-text-main outline-none rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
              />
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5 min-h-[160px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60 text-xs py-10">
                <ShoppingCart className="w-10 h-10 mb-2 stroke-1" />
                <p className="font-semibold">Keranjang masih kosong</p>
                <p className="text-[11px]">Klik produk dari katalog atau gunakan AI Smart Order.</p>
              </div>
            ) : (
              cart.map((item) => {
                const isCustom = item.product.price_type === 'CUSTOM' || 
                  item.product.unit_name?.toLowerCase().includes('meter') || 
                  item.product.name.toLowerCase().includes('banner') || 
                  item.product.name.toLowerCase().includes('spanduk');

                return (
                  <div key={item.product.id} className="skeuo-inset p-3 rounded-xl flex flex-col gap-2 text-xs bg-white/30 dark:bg-black/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <h4 className="font-bold text-text-main text-xs">{item.product.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-text-muted">Harga Satuan:</span>
                          <span className="font-mono font-semibold text-text-muted">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)} 
                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Kalkulator Meteran Spanduk / Banner (Jika produk custom) */}
                    {isCustom && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-1 text-[11px] text-text-main">
                        <div className="flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="font-semibold text-amber-700 dark:text-amber-300">P×L (m):</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={item.length || 1}
                            onChange={e => updateDimensions(item.product.id, Number(e.target.value), item.width || 1)}
                            className="w-11 px-1 py-0.5 text-center font-bold outline-none rounded bg-white dark:bg-black/40 border border-black/10 text-xs"
                            title="Panjang (meter)"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={item.width || 1}
                            onChange={e => updateDimensions(item.product.id, item.length || 1, Number(e.target.value))}
                            className="w-11 px-1 py-0.5 text-center font-bold outline-none rounded bg-white dark:bg-black/40 border border-black/10 text-xs"
                            title="Lebar (meter)"
                          />
                          <span className="font-bold text-amber-700 dark:text-amber-300 ml-1">
                            = {((item.length || 1) * (item.width || 1)).toFixed(1)} m²
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subtotal & Quantity Controls */}
                    <div className="flex justify-between items-center pt-1.5 border-t border-black/5 dark:border-white/5">
                      <span className="font-bold text-brand-600 text-xs">
                        Subtotal: Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </span>
                      
                      <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/40 rounded-lg p-0.5 border border-black/10">
                        <button 
                          onClick={() => updateQty(item.product.id, -1)} 
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 text-text-main font-bold"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.product.id, 1)} 
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 text-text-main font-bold"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout & Bill Summary Footer */}
          <div className="pt-3 border-t border-black/10 dark:border-white/10 mt-2 space-y-2.5">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} barang)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between items-center text-text-muted">
                <span>Diskon Toko (Rp):</span>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="w-24 px-2 py-0.5 text-right font-semibold text-xs skeuo-inset rounded outline-none text-text-main bg-transparent border border-black/10"
                />
              </div>

              <div className="flex justify-between items-baseline pt-1.5 border-t border-black/5 font-bold text-text-main">
                <span className="text-xs">TOTAL TAGIHAN</span>
                <span className="text-lg text-brand-600 font-extrabold font-mono">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-xs shadow-md hover:from-brand-600 hover:to-brand-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" /> 
              <span>Bayar / Simpan Pesanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHECKOUT & PAYMENT MODAL */}
      {/* ========================================================================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProcessTransaction} className="skeuo p-6 w-full max-w-md bg-bg-skeuo space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-500" />
                Penyelesaian Pembayaran Kasir
              </h2>
              <button type="button" onClick={() => setShowCheckoutModal(false)} className="text-text-muted hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl skeuo-inset bg-brand-50/50 dark:bg-brand-950/20 text-center">
              <p className="text-[11px] text-text-muted">Total Tagihan Final:</p>
              <p className="text-2xl font-black text-brand-600 font-mono">Rp {total.toLocaleString('id-ID')}</p>
            </div>

            {/* Jenis Pembayaran (Lunas / DP / Tempo) */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Metode / Status Tagihan:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PAID', label: 'Lunas (Cash)', desc: 'Bayar Penuh' },
                  { id: 'DP', label: 'Uang Muka (DP)', desc: 'Sebagian' },
                  { id: 'UNPAID', label: 'Belum Bayar', desc: 'Tempo' },
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      const nextSt = st.id as PaymentStatus;
                      setPaymentStatus(nextSt);
                      if (nextSt === 'PAID') setPayAmount(total);
                      if (nextSt === 'UNPAID') setPayAmount(0);
                    }}
                    className={`py-2 px-1 text-center rounded-xl transition-all border ${
                      paymentStatus === st.id 
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40 text-brand-600 font-bold shadow-sm' 
                        : 'border-transparent skeuo-button text-text-muted'
                    }`}
                  >
                    <p className="text-xs">{st.label}</p>
                    <p className="text-[9px] opacity-70">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Nominal Bayar */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Nominal yang Diterima (Rp):</label>
              <div className="px-4 py-2 skeuo-inset rounded-xl bg-white/40 dark:bg-black/20">
                <input 
                  type="number" 
                  min="0"
                  value={payAmount || ''}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  placeholder="0"
                  className="bg-transparent border-none outline-none w-full text-text-main font-black text-lg font-mono"
                />
              </div>

              {/* Quick Cash Suggestions */}
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setPayAmount(total)}
                  className="px-2.5 py-1 text-[10px] font-bold skeuo-button text-brand-600 rounded-lg whitespace-nowrap"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000, 500000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPayAmount(val)}
                    className="px-2 py-1 text-[10px] font-medium skeuo-button text-text-muted rounded-lg whitespace-nowrap"
                  >
                    Rp {(val / 1000).toFixed(0)}rb
                  </button>
                ))}
              </div>

              {/* Kembalian / Piutang Alert */}
              {payAmount > total && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex justify-between">
                  <span>Kembalian Kasir:</span>
                  <span className="font-mono">Rp {(payAmount - total).toLocaleString('id-ID')}</span>
                </div>
              )}
              {payAmount < total && paymentStatus !== 'PAID' && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-xs flex justify-between">
                  <span>Sisa Tagihan / DP:</span>
                  <span className="font-mono">Rp {(total - payAmount).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Estimasi Selesai */}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Estimasi Selesai Cetak (Opsional):
              </label>
              <input 
                type="date" 
                value={estimatedDoneAt}
                onChange={e => setEstimatedDoneAt(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-text-main skeuo-inset rounded-lg outline-none bg-transparent border border-black/10"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs"
                disabled={submitting}
              >
                Kembali
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs shadow-md disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Selesaikan & Cetak'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI SMART ORDER PARSER MODAL */}
      {/* ========================================================================= */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 w-full max-w-lg bg-bg-skeuo max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-brand-500 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-main">AI Smart Order Parser</h3>
                  <p className="text-[10px] text-text-muted">Google AI Studio (Gemini Flash) • Auto Extract Chat WA</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAIModal(false);
                  setAiResult(null);
                  setAiError(null);
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

            <form onSubmit={handleParseAIOrder} className="space-y-3">
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
              <div className="mt-3 pt-3 border-t border-black/10 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-text-main flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Hasil Deteksi AI ({aiResult.items.length} Item)
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                    {aiResult.used_model}
                  </span>
                </div>

                {aiResult.customer_name_hint && (
                  <div className="p-2 rounded-lg skeuo-inset text-[11px] text-text-main bg-white/40">
                    <span className="text-text-muted">Nama Pelanggan:</span> <strong className="text-brand-600">{aiResult.customer_name_hint}</strong>
                  </div>
                )}

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {aiResult.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl skeuo-inset text-xs bg-white/40 dark:bg-black/30 space-y-1">
                      <div className="flex justify-between font-bold text-text-main">
                        <span>{it.matched_product_name || it.product_name}</span>
                        <span className="text-brand-600 font-mono font-extrabold">Qty: {it.qty}</span>
                      </div>
                      
                      <div className="flex justify-between text-[11px] text-text-muted">
                        <span>
                          {it.length && it.width ? `Ukuran: ${it.length}m × ${it.width}m (${(it.length * it.width).toFixed(1)} m²)` : 'Ukuran Standar'}
                        </span>
                        {it.subtotal ? (
                          <span className="font-bold text-emerald-600">
                            Est. Rp {it.subtotal.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-amber-600">Cocokkan di kasir</span>
                        )}
                      </div>
                      
                      {it.notes && (
                        <p className="text-[10px] text-text-muted italic bg-black/5 p-1 rounded">
                          Catatan: {it.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="flex-1 py-2 font-bold skeuo-button text-text-muted text-xs"
                  >
                    Ulangi
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAIItems}
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
      )}

      {/* ========================================================================= */}
      {/* BANNER / SPANDUK CALCULATOR MODAL */}
      {/* ========================================================================= */}
      {showCalcModal && (
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
              <button 
                onClick={() => setShowCalcModal(false)} 
                className="text-text-muted hover:text-text-main"
              >
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
              {(() => {
                const area = Math.round((calcLength * calcWidth) * 100) / 100;
                const unitPrice = Math.round(area * calcRatePerMeter);
                const totalCost = unitPrice * calcQty;

                return (
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
                );
              })()}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalcModal(false)}
                  className="flex-1 py-2.5 font-bold skeuo-button text-text-muted text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const area = Math.round((calcLength * calcWidth) * 100) / 100;
                    const unitPrice = Math.round(area * calcRatePerMeter);
                    const targetProd = calcSelectedProduct || products[0];
                    if (!targetProd) return;

                    setCart(prev => [
                      ...prev,
                      {
                        product: targetProd,
                        qty: calcQty,
                        price: unitPrice,
                        length: calcLength,
                        width: calcWidth
                      }
                    ]);
                    setShowCalcModal(false);
                  }}
                  className="flex-1 py-2.5 font-bold skeuo-button-primary bg-brand-500 hover:bg-brand-600 text-white text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Tambahkan ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* SUCCESS MODAL WITH PRINTABLE THERMAL SLIP */}
      {/* ========================================================================= */}
      {invoiceData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="skeuo p-6 w-full max-w-sm bg-bg-skeuo">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/10">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> Transaksi Selesai!
              </h3>
              <button onClick={() => setInvoiceData(null)} className="text-text-muted hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Preview */}
            <div id="thermal-receipt" className="bg-white text-black p-4 font-mono text-[11px] leading-tight rounded-lg shadow-inner mb-4 space-y-2 border border-slate-300">
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
