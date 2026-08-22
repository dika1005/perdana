'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { transactionService } from '../../services/transactionService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { Customer } from '../../types/customer';
import { formatRupiah } from '../../utils/format';
import { PaymentStatus } from '../../types/transaction';
import { useAlert } from '../../context/AlertContext';

import dynamic from 'next/dynamic';

// Modular POS Components
import { ProductCatalog } from '../../components/pos/ProductCatalog';
import { CartSidebar } from '../../components/pos/CartSidebar';
import { CartItem } from '../../components/pos/types';

const CheckoutModal = dynamic(
  () => import('../../components/pos/CheckoutModal').then(mod => mod.CheckoutModal),
  { ssr: false }
);
const BannerCalculatorModal = dynamic(
  () => import('../../components/pos/BannerCalculatorModal').then(mod => mod.BannerCalculatorModal),
  { ssr: false }
);
const AISmartOrderModal = dynamic(
  () => import('../../components/pos/AISmartOrderModal').then(mod => mod.AISmartOrderModal),
  { ssr: false }
);
const ReceiptModal = dynamic(
  () => import('../../components/pos/ReceiptModal').then(mod => mod.ReceiptModal),
  { ssr: false }
);

export default function POSPage() {
  const { showAlert, showConfirm, showToast } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [estimatedDoneAt, setEstimatedDoneAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  // Tools Modal State
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

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
    let initialPrice = Number(product.default_price) || 0;
    if (product.price_type === 'RANGE' && initialPrice <= 0) {
      initialPrice = Number(product.min_price) || 0;
    }
    const initialQty = Number(product.min_order) > 0 ? Number(product.min_order) : 1;

    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { 
        product, 
        qty: initialQty, 
        price: initialPrice,
        length: 1,
        width: 1
      }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const minOrder = Number(item.product.min_order) || 1;
        const newQty = item.qty + delta;
        if (newQty < minOrder) {
          showToast(`Kuantitas minimal produk "${item.product.name}" adalah ${minOrder} ${item.product.unit_name || 'pcs'}`, 'warning');
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: number, price: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        return { ...item, price: Math.max(0, price) };
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

  const clearCart = async () => {
    if (cart.length > 0) {
      const confirmed = await showConfirm({
        title: 'Kosongkan Keranjang?',
        message: 'Semua item pesanan yang sudah dipilih akan dihapus dari keranjang.',
        type: 'danger',
        confirmText: 'Ya, Kosongkan',
      });
      if (confirmed) {
        setCart([]);
        showToast('Keranjang belanja dikosongkan', 'info');
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleOpenCheckout = async () => {
    if (cart.length === 0) {
      await showAlert({
        title: 'Keranjang Kosong',
        message: 'Silakan pilih produk terlebih dahulu sebelum melanjutkan ke pembayaran.',
        type: 'warning',
      });
      return;
    }

    // Validasi harga range dan harga 0
    for (const item of cart) {
      if (item.price <= 0) {
        await showAlert({
          title: 'Harga Belum Diisi',
          message: `Harga untuk produk "${item.product.name}" belum diisi (masih Rp 0). Silakan masukkan nominal harga terlebih dahulu.`,
          type: 'warning',
        });
        return;
      }

      if (item.product.price_type === 'RANGE') {
        const minP = Number(item.product.min_price) || 0;
        const maxP = Number(item.product.max_price) || 0;
        if (item.price < minP || item.price > maxP) {
          await showAlert({
            title: 'Harga Di Luar Batas',
            message: `Harga produk "${item.product.name}" harus di antara ${formatRupiah(minP)} dan ${formatRupiah(maxP)}.`,
            type: 'warning',
          });
          return;
        }
      }

      const minOrder = Number(item.product.min_order) || 1;
      if (item.qty < minOrder) {
        await showAlert({
          title: 'Kuantitas Minimum Belum Terpenuhi',
          message: `Kuantitas produk "${item.product.name}" minimal ${minOrder} ${item.product.unit_name || 'pcs'}.`,
          type: 'warning',
        });
        return;
      }
    }

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
        estimated_done_at: estimatedDoneAt.trim() ? estimatedDoneAt : undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          custom_price: item.price,
          qty: item.qty,
        })),
      };

      const res = await transactionService.createTransaction(payload as any);
      setInvoiceData({
        ...res,
        items: cart.map(c => ({
          product_name: c.product.name,
          qty: c.qty,
          custom_price: c.price,
          unit_name: c.product.unit_name,
          length: c.length,
          width: c.width,
        })),
        store_name: 'PERDANA PERCETAKAN',
      });
      setShowCheckoutModal(false);
      showToast('Transaksi berhasil diproses!', 'success');

      // Reset Form Cart
      setCart([]);
      setSelectedCustomer(null);
      setCustomCustomerName('');
      setDiscountAmount(0);
      setPayAmount(0);
      setEstimatedDoneAt('');
    } catch (err: any) {
      console.error('Transaction creation error:', err);
      const errData = err?.response?.data;
      let msg = errData?.message || 'Gagal memproses transaksi';
      if (errData?.errors && typeof errData.errors === 'object') {
        const details = Object.entries(errData.errors)
          .map(([_field, errs]) => Array.isArray(errs) ? errs.join(', ') : errs)
          .join('\n');
        if (details) {
          msg = `${msg}:\n• ${details}`;
        }
      }
      await showAlert({
        title: 'Gagal Memproses Transaksi',
        message: msg,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  const handleApplyAIItems = (items: CartItem[], customerNameHint?: string) => {
    const updatedCart = [...cart];
    for (const newItem of items) {
      const existingIdx = updatedCart.findIndex(c => c.product.id === newItem.product.id);
      if (existingIdx > -1) {
        updatedCart[existingIdx] = {
          ...updatedCart[existingIdx],
          qty: updatedCart[existingIdx].qty + newItem.qty,
          length: newItem.length || updatedCart[existingIdx].length,
          width: newItem.width || updatedCart[existingIdx].width,
          price: newItem.price || updatedCart[existingIdx].price,
        };
      } else {
        updatedCart.push(newItem);
      }
    }
    if (customerNameHint && !selectedCustomer) {
      setCustomCustomerName(customerNameHint);
    }
    setCart(updatedCart);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-5 h-full pb-4">
        {/* Left Column: Product Catalog & Search */}
        <ProductCatalog
          products={products}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearchSubmit={handleSearch}
          loading={loading}
          cart={cart}
          onAddToCart={addToCart}
          onOpenBannerCalc={() => setShowCalcModal(true)}
          onOpenAIModal={() => setShowAIModal(true)}
        />

        {/* Right Column: Cart Sidebar & Controls */}
        <CartSidebar
          cart={cart}
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          customCustomerName={customCustomerName}
          onCustomCustomerNameChange={setCustomCustomerName}
          onUpdateQty={updateQty}
          onUpdatePrice={updatePrice}
          onUpdateDimensions={updateDimensions}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          discountAmount={discountAmount}
          onDiscountChange={setDiscountAmount}
          subtotal={subtotal}
          total={total}
          onOpenCheckout={handleOpenCheckout}
        />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        total={total}
        customerName={selectedCustomer ? selectedCustomer.name : (customCustomerName.trim() || 'Pelanggan Umum')}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
        payAmount={payAmount}
        onPayAmountChange={setPayAmount}
        estimatedDoneAt={estimatedDoneAt}
        onEstimatedDoneAtChange={setEstimatedDoneAt}
        submitting={submitting}
        onSubmit={handleProcessTransaction}
      />

      {/* Banner Spanduk Meteran Calculator Modal */}
      <BannerCalculatorModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        products={products}
        onAddToCart={item => {
          const existing = cart.find(c => c.product.id === item.product.id);
          if (existing) {
            setCart(cart.map(c => c.product.id === item.product.id ? { 
              ...c, 
              qty: c.qty + item.qty, 
              price: item.price,
              length: item.length,
              width: item.width
            } : c));
          } else {
            setCart([...cart, item]);
          }
        }}
      />

      {/* AI Smart Order Modal */}
      <AISmartOrderModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        products={products}
        onApplyItems={handleApplyAIItems}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        invoiceData={invoiceData}
        onClose={() => setInvoiceData(null)}
        onPrint={triggerBrowserPrint}
      />
    </DashboardLayout>
  );
}
