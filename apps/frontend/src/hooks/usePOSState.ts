import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, ProductAddon } from '../types/product';
import { Category } from '../types/category';
import { Customer } from '../types/customer';
import { RawMaterial } from '../types/rawMaterial';
import { PaymentStatus, PaymentMethod } from '../types/transaction';
import { CartItem, CartItemMaterial } from '../components/pos/types';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { rawMaterialService } from '../services/rawMaterialService';
import { transactionService } from '../services/transactionService';
import { useAlert } from '../context/AlertContext';
import { formatRupiah } from '../utils/format';

export function isMeteranProduct(product: Product): boolean {
  const unit = (product.unit_name || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return unit.includes('meter') || name.includes('/meter');
}

export function meteranRefPrice(product: Product, length?: number, width?: number): number {
  const rate = Number(product.default_price) || 0;
  if (!isMeteranProduct(product)) return rate;
  return Math.round((length || 1) * (width || 1) * rate);
}

/** Pesan error bila harga item produk RANGE berada di luar rentang master. */
export function cartItemRangeIssue(item: CartItem): string | null {
  if (item.product.price_type !== 'RANGE') return null;
  const min = Number(item.product.min_price) || 0;
  const max = Number(item.product.max_price) || 0;
  if ((min > 0 && item.price < min) || (max > 0 && item.price > max)) {
    return `Harga "${item.product.name}" (${formatRupiah(item.price)}) berada di luar rentang standar ${formatRupiah(min)} – ${formatRupiah(max)}.`;
  }
  return null;
}

/** Pesan error bila qty item di bawah minimum order produk. */
export function cartItemMinOrderIssue(item: CartItem): string | null {
  const minOrder = Number(item.product.min_order) || 0;
  if (minOrder > 0 && item.qty < minOrder) {
    return `"${item.product.name}" memiliki minimum order ${minOrder} ${item.product.unit_name || 'pcs'}, sedangkan jumlah saat ini ${item.qty}.`;
  }
  return null;
}

export function usePOSState() {
  const { showAlert, showToast } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableAddons, setAvailableAddons] = useState<ProductAddon[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [estimatedDoneAt, setEstimatedDoneAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const checkoutKeyRef = useRef<string | null>(null);

  // Receipt Modal State
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  // Tools Modal State
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  /**
   * Data referensi (kategori, pelanggan, add-on, bahan) di-load SEKALI saat
   * halaman POS dibuka — tidak ikut refetch setiap kali user mengetik search.
   */
  const fetchReferences = useCallback(async () => {
    try {
      const [catRes, custRes, addonRes, matRes] = await Promise.all([
        productService.getCategories(),
        customerService.getCustomers(),
        productService.getAddons(),
        rawMaterialService.getRawMaterials(),
      ]);
      setCategories(catRes);
      setCustomers(custRes.data);
      setAvailableAddons(addonRes);
      setRawMaterials(matRes.data);
    } catch (err: any) {
      console.error('Failed to load POS reference data:', err);
    }
  }, []);

  /** Hanya produk yang ikut refetch saat search/filter kategori berubah. */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const prodRes = await productService.getProducts({
        search: searchTerm || undefined,
        category_id: activeCategoryId,
      });
      setProducts(prodRes.data);
    } catch (err: any) {
      console.error('Failed to load POS products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeCategoryId]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  // Debounced search: fetch setelah user berhenti mengetik 300ms.
  // Di mount (searchTerm kosong) langsung fetch tanpa menunggu.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchProducts, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const addToCart = (product: Product, override?: { price?: number; qty?: number; length?: number; width?: number }) => {
    let initialPrice = Number(product.default_price) || 0;
    if (product.price_type === 'RANGE' && initialPrice <= 0) {
      initialPrice = Number(product.min_price) || 0;
    }
    const initialQty = Number(product.min_order) > 0 ? Number(product.min_order) : 1;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item => item.product.id === product.id ? { 
          ...item, 
          qty: item.qty + (override?.qty ?? 1),
          ...(override?.price !== undefined ? { price: override.price } : {}),
          ...(override?.length !== undefined ? { length: override.length } : {}),
          ...(override?.width !== undefined ? { width: override.width } : {}),
        } : item);
      } else {
        const isMeter = isMeteranProduct(product);
        return [...prevCart, { 
          product, 
          qty: override?.qty ?? initialQty, 
          price: override?.price ?? initialPrice,
          length: override?.length ?? (isMeter ? 1 : undefined),
          width: override?.width ?? (isMeter ? 1 : undefined),
          addons: [],
          materials: [],
        }];
      }
    });
  };



  const handleToggleAddon = (productId: number, addon: ProductAddon) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id !== productId) return item;
      const existingAddons = item.addons || [];
      const isExisting = existingAddons.some(a => a.addon.id === addon.id);
      let updatedAddons;
      if (isExisting) {
        updatedAddons = existingAddons.filter(a => a.addon.id !== addon.id);
      } else {
        updatedAddons = [...existingAddons, {
          addon,
          price: Number(addon.default_price) || 0,
          qty: 1,
        }];
      }
      return { ...item, addons: updatedAddons };
    }));
  };

  const handleUpdateAddonQty = (productId: number, addonId: number, qty: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id !== productId) return item;
      const updatedAddons = (item.addons || []).map(a => {
        if (a.addon.id === addonId) {
          return { ...a, qty: Math.max(1, qty) };
        }
        return a;
      });
      return { ...item, addons: updatedAddons };
    }));
  };

  const handleAddMaterial = (productId: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id !== productId) return item;
      return { ...item, materials: [...(item.materials || []), { raw_material_id: 0, material_qty: 0 }] };
    }));
  };

  const handleUpdateMaterial = (productId: number, index: number, patch: Partial<CartItemMaterial>) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id !== productId) return item;
      const materials = (item.materials || []).map((m, i) => (i === index ? { ...m, ...patch } : m));
      return { ...item, materials };
    }));
  };

  const handleRemoveMaterial = (productId: number, index: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id !== productId) return item;
      return { ...item, materials: (item.materials || []).filter((_m, i) => i !== index) };
    }));
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: number, price: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id === id) {
        return { ...item, price: Math.max(0, price) };
      }
      return item;
    }));
  };

  const updateDimensions = (id: number, length: number, width: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.product.id !== id) return item;
      const oldRef = meteranRefPrice(item.product, item.length, item.width);
      const newRef = meteranRefPrice(item.product, length, width);
      // Harga yang masih mengikuti hitungan luas diperbarui otomatis;
      // harga hasil nego manual tidak ditimpa.
      const price = item.price === oldRef ? newRef : item.price;
      return { ...item, length, width, price };
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  const subtotal = cart.reduce((sum, item) => {
    const itemBase = item.price * item.qty;
    const addonsBase = (item.addons || []).reduce((aSum, a) => aSum + ((Number(a.price) || 0) * (Number(a.qty) || 1)), 0);
    return sum + itemBase + addonsBase;
  }, 0);
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

    for (const item of cart) {
      if (item.price <= 0) {
        await showAlert({
          title: 'Harga Belum Diisi',
          message: `Harga untuk produk "${item.product.name}" belum diisi (masih Rp 0). Silakan masukkan nominal harga terlebih dahulu.`,
          type: 'warning',
        });
        return;
      }
    }

    for (const item of cart) {
      const rangeIssue = cartItemRangeIssue(item);
      if (rangeIssue) {
        await showAlert({
          title: 'Harga di Luar Rentang',
          message: `${rangeIssue} Sesuaikan harga terlebih dahulu sebelum checkout.`,
          type: 'warning',
        });
        return;
      }
      const minOrderIssue = cartItemMinOrderIssue(item);
      if (minOrderIssue) {
        await showAlert({
          title: 'Minimum Order Belum Terpenuhi',
          message: `${minOrderIssue} Naikkan jumlah atau hapus item tersebut.`,
          type: 'warning',
        });
        return;
      }
    }

    for (const item of cart) {
      const rows = item.materials || [];
      const incomplete = rows.some(m => m.raw_material_id <= 0 || !(m.material_qty > 0));
      if (incomplete) {
        await showAlert({
          title: 'Bahan Belum Lengkap',
          message: `Lengkapi pilihan bahan dan jumlahnya (lebih dari 0) pada item "${item.product.name}", atau hapus baris yang kosong.`,
          type: 'warning',
        });
        return;
      }
      if (item.product.uses_material && rows.length === 0) {
        await showAlert({
          title: 'Bahan Belum Diisi',
          message: `Produk "${item.product.name}" memakai bahan stok. Isi bahan yang digunakan untuk produksi pada item tersebut.`,
          type: 'warning',
        });
        return;
      }
    }

    // Validasi awal total kebutuhan bahan lintas item terhadap stok tersedia.
    // Server tetap sumber kebenaran (reservasi atomik), ini hanya agar kasir
    // mendapat umpan balik cepat sebelum request dikirim.
    const requiredByMaterial = new Map<number, number>();
    for (const item of cart) {
      for (const m of item.materials || []) {
        if (m.raw_material_id > 0 && m.material_qty > 0) {
          requiredByMaterial.set(
            m.raw_material_id,
            (requiredByMaterial.get(m.raw_material_id) || 0) + m.material_qty
          );
        }
      }
    }
    const shortages = [...requiredByMaterial.entries()]
      .map(([materialId, totalQty]) => {
        const mat = rawMaterials.find(r => r.id === materialId);
        if (!mat) return null;
        const available = Number(mat.available_stock) || 0;
        return totalQty > available
          ? `"${mat.name}": butuh ${totalQty} ${mat.unit}, tersedia ${available} ${mat.unit}.`
          : null;
      })
      .filter((msg): msg is string => msg !== null);
    if (shortages.length > 0) {
      await showAlert({
        title: 'Stok Bahan Tidak Cukup',
        message: `Kebutuhan bahan melebihi stok tersedia:\n• ${shortages.join('\n• ')}`,
        type: 'warning',
      });
      return;
    }

    setPayAmount(total);
    checkoutKeyRef.current = crypto.randomUUID();
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
        payment_method: paymentMethod,
        idempotency_key: checkoutKeyRef.current || crypto.randomUUID(),
        estimated_done_at: estimatedDoneAt.trim() ? estimatedDoneAt : undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          custom_price: item.price,
          qty: item.qty,
          length: item.length && item.length > 0 ? item.length : undefined,
          width: item.width && item.width > 0 ? item.width : undefined,
          addons: (item.addons || []).map(a => ({
            addon_id: a.addon.id,
            addon_name: a.addon.name,
            price: a.price,
            qty: a.qty,
          })),
          materials: (item.materials || [])
            .filter(m => m.raw_material_id > 0 && m.material_qty > 0)
            .map(m => ({ raw_material_id: m.raw_material_id, material_qty: m.material_qty })),
        })),
      };

      const res = await transactionService.createTransaction(payload);
      
      try {
        const officialInvoice = await transactionService.getInvoiceData(res.id);
        setInvoiceData(officialInvoice);
      } catch (err) {
        console.error('Gagal mengambil data invoice resmi:', err);
        await showAlert({
          title: 'Gagal Mencetak Struk',
          message: 'Data struk dari server tidak dapat diambil. Transaksi TERSIMPAN, tapi struk tidak dicetak untuk menghindari kesalahan. Silakan buka riwayat & cetak ulang nota.',
          type: 'error',
        });
        // CATATAN KEAMANAN: sengaja TIDAK membuat struk dari data client-side
        // agar nilai di struk selalu sama dengan yang tersimpan di database.
      }

      setShowCheckoutModal(false);
      showToast('Transaksi berhasil diproses!', 'success');

      // Reset Form Cart
      setCart([]);
      setSelectedCustomer(null);
      setCustomCustomerName('');
      setDiscountAmount(0);
      setPayAmount(0);
      setPaymentMethod('CASH');
      setEstimatedDoneAt('');
      checkoutKeyRef.current = null;

      // Segarkan daftar produk & saldo stok bahan agar tampilan "sisa stok"
      // mencerminkan reservasi/konsumsi yang baru saja terjadi.
      fetchProducts();
      fetchReferences();
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

  return {
    products,
    categories,
    customers,
    rawMaterials,
    availableAddons,
    activeCategoryId,
    setActiveCategoryId,
    searchTerm,
    setSearchTerm,
    loading,
    cart,
    setCart,
    selectedCustomer,
    setSelectedCustomer,
    customCustomerName,
    setCustomCustomerName,
    discountAmount,
    setDiscountAmount,
    showCheckoutModal,
    setShowCheckoutModal,
    payAmount,
    setPayAmount,
    paymentStatus,
    setPaymentStatus,
    paymentMethod,
    setPaymentMethod,
    estimatedDoneAt,
    setEstimatedDoneAt,
    submitting,
    invoiceData,
    setInvoiceData,
    showCalcModal,
    setShowCalcModal,
    showAIModal,
    setShowAIModal,
    subtotal,
    total,
    handleSearch,
    addToCart,
    handleToggleAddon,
    handleUpdateAddonQty,
    handleAddMaterial,
    handleUpdateMaterial,
    handleRemoveMaterial,
    updateQty,
    updatePrice,
    updateDimensions,
    removeFromCart,
    clearCart,
    handleOpenCheckout,
    handleProcessTransaction,
    handleApplyAIItems,
  };
}
