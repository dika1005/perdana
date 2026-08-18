# Panduan Arsitektur & Pengerjaan Frontend — POS & Inventory Percetakan Perdana

Dokumen ini adalah panduan komprehensif, standar *best practice*, dan arsitektur pengerjaan aplikasi frontend yang terintegrasi penuh dengan backend REST API Percetakan Perdana.

---

## 1. Spesifikasi Teknis & Konfigurasi Dasar

### Rekomendasi Tech Stack
- **Framework**: React (Vite / Next.js) + TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS modern dengan sistem token warna konsisten.
- **Server State & Data Fetching**: **TanStack Query (React Query)** *(Sangat direkomendasikan untuk caching otomatis, refetching, dan auto-invalidation)*.
- **Client State Management**: **Zustand** (untuk POS Cart / Keranjang Kasir & session UI).
- **HTTP Client**: **Axios** (dengan konfigurasi `withCredentials: true` untuk automatic HttpOnly cookie).
- **Icons**: Lucide Icons / Heroicons.
- **Printing**: Native CSS `@media print` untuk nota kasir thermal 58mm / 80mm.

### Konfigurasi Environment (`.env.local` / `.env`)
```env
VITE_API_BASE_URL=http://localhost:8800/api/v1
# atau jika menggunakan Next.js:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8800/api/v1
```

> **PENTING: Autentikasi Menggunakan HttpOnly Cookie**  
> Backend telah dilengkapi fitur **Auto-Detection Cookie**. Pastikan setiap pemanggilan Axios / Fetch menyertakan opsi `{ withCredentials: true }` agar cookie `access_token` dan `refresh_token` terkirim dan tersimpan otomatis tanpa perlu repot menyimpan token di `localStorage`.

---

## 2. Standar Struktur Folder (*Layered Clean Architecture*)

Susunan folder yang rapi dan terisolasi mempermudah kolaborasi dan skalabilitas:

```text
src/
├── api/                  # Konfigurasi Axios client & interceptor
│   └── client.ts
├── types/                # Semua definisi TypeScript interface & enum
│   ├── auth.ts
│   ├── category.ts
│   ├── product.ts
│   ├── inventory.ts
│   ├── transaction.ts
│   ├── customer.ts
│   ├── report.ts
│   └── api.ts
├── services/             # Pure API service functions (pemanggil endpoint)
│   ├── authService.ts
│   ├── userService.ts
│   ├── categoryService.ts
│   ├── productService.ts
│   ├── inventoryService.ts
│   ├── customerService.ts
│   ├── transactionService.ts
│   └── reportService.ts
├── hooks/                # Custom React Query Hooks (useQuery & useMutation)
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useInventory.ts
│   ├── useTransactions.ts
│   └── useReports.ts
├── stores/               # Global state (Zustand)
│   ├── useAuthStore.ts
│   └── useCartStore.ts   # State keranjang belanja POS kasir
├── components/           # Komponen UI Reusable
│   ├── common/           # Button, Input, Modal, Badge, Table, Pagination
│   ├── pos/              # ProductGrid, CartDrawer, AddonSelector, RangePriceModal
│   ├── tracking/         # KanbanBoard, StatusPill, OverdueAlert
│   ├── receipt/          # ThermalReceiptPrint (58mm/80mm)
│   └── layout/           # Sidebar, Navbar, RoleGuard
└── pages/                # Halaman / Views aplikasi
    ├── Login.tsx
    ├── POSKasir.tsx
    ├── JobTracking.tsx
    ├── MasterProduk.tsx
    ├── InventarisBahan.tsx
    ├── Pelanggan.tsx
    ├── Laporan.tsx
    └── ManajemenUser.tsx
```

---

## 3. Implementasi Kode Standar (*Copy-Paste Ready*)

### A. HTTP Client (`src/api/client.ts`)
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8800/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Wajib: agar cookie JWT terkirim otomatis
});

// Response interceptor untuk menangani session expired / error validasi
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Optional: Panggil endpoint refresh token otomatis atau redirect ke login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### B. Standard Response & Entity Types (`src/types/`)

#### `src/types/api.ts`
```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
```

#### `src/types/product.ts`
```typescript
export type PriceType = 'FIXED' | 'RANGE' | 'CUSTOM';
export type RangePriceType = 'FIXED' | 'RANGE';

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  price_type: RangePriceType;
  price: number;
  min_price: number;
  max_price: number;
  created_at: string;
}

export interface Product {
  id: number;
  category_id?: number | null;
  name: string;
  price_type: PriceType;
  default_price: number;
  min_price: number;
  max_price: number;
  min_order: number;
  unit_name: string;
  has_variants: boolean;
  created_at: string;
  variants?: ProductVariant[];
}

export interface ProductAddon {
  id: number;
  name: string;
  price_type: RangePriceType;
  default_price: number;
  min_price: number;
  max_price: number;
  created_at: string;
}
```

#### `src/types/transaction.ts`
```typescript
export type PaymentStatus = 'PAID' | 'DP' | 'UNPAID';
export type OrderStatus = 'ANTRIAN' | 'PROSES' | 'SELESAI' | 'DIAMBIL';

export interface CartItemAddon {
  addon_id?: number;
  addon_name: string;
  price: number;
  qty: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  product_variant_id?: number | null;
  variant_name?: string | null;
  price_type: PriceType;
  unit_price: number;
  qty: number;
  min_order: number;
  unit_name: string;
  addons: CartItemAddon[];
  subtotal: number;
}

export interface CreateTransactionPayload {
  customer_id?: number | null;
  customer_name?: string;
  discount_amount?: number;
  pay_amount: number;
  payment_status?: PaymentStatus;
  estimated_done_at?: string; // YYYY-MM-DD
  items: {
    product_id: number;
    product_variant_id?: number;
    custom_price?: number;
    qty: number;
    addons?: {
      addon_id?: number;
      addon_name?: string;
      price?: number;
      qty?: number;
    }[];
  }[];
}
```

---

### C. Services Layer (`src/services/`)

#### `src/services/productService.ts`
```typescript
import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { Product, ProductAddon } from '../types/product';

export const productService = {
  getProducts: async (params?: { page?: number; search?: string; category_id?: number }) => {
    const res = await apiClient.get<ListResponse<Product>>('/products', { params });
    return res.data;
  },

  getProductById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  getAddons: async (params?: { search?: string }) => {
    const res = await apiClient.get<ListResponse<ProductAddon>>('/addons', { params });
    return res.data.data;
  },

  createProduct: async (payload: Partial<Product>) => {
    const res = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return res.data.data;
  },
};
```

#### `src/services/transactionService.ts`
```typescript
import { apiClient } from '../api/client';
import { ApiResponse, ListResponse } from '../types/api';
import { CreateTransactionPayload, OrderStatus, PaymentStatus } from '../types/transaction';

export const transactionService = {
  createTransaction: async (payload: CreateTransactionPayload) => {
    const res = await apiClient.post<ApiResponse<any>>('/transactions', payload);
    return res.data.data;
  },

  getTransactions: async (params?: { page?: number; search?: string; date?: string; order_status?: OrderStatus }) => {
    const res = await apiClient.get<ListResponse<any>>('/transactions', { params });
    return res.data;
  },

  updateOrderStatus: async (id: number, status: OrderStatus) => {
    const res = await apiClient.patch<ApiResponse<any>>(`/transactions/${id}/status`, { order_status: status });
    return res.data.data;
  },

  updatePayment: async (id: number, additionalPayAmount: number, paymentStatus?: PaymentStatus) => {
    const res = await apiClient.patch<ApiResponse<any>>(`/transactions/${id}/payment`, {
      additional_pay_amount: additionalPayAmount,
      payment_status: paymentStatus,
    });
    return res.data.data;
  },

  getInvoiceData: async (id: number) => {
    const res = await apiClient.get<ApiResponse<any>>(`/transactions/${id}/invoice`);
    return res.data.data;
  },
};
```

---

### D. Custom React Query Hooks (`src/hooks/`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { transactionService } from '../services/transactionService';
import { CreateTransactionPayload, OrderStatus } from '../types/transaction';

export const useProducts = (params?: { page?: number; search?: string; category_id?: number }) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionService.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      transactionService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
```

---

### E. POS Cart State Management (`src/stores/useCartStore.ts`)

Mengelola item belanja, validasi min order, pemilihan add-on, dan kalkulasi tagihan kasir:

```typescript
import { create } from 'zustand';
import { CartItem, CartItemAddon } from '../types/transaction';

interface CartState {
  items: CartItem[];
  customerName: string;
  customerId: number | null;
  discountAmount: number;
  payAmount: number;
  estimatedDoneAt: string;
  setCustomer: (id: number | null, name: string) => void;
  setDiscount: (amount: number) => void;
  setPayAmount: (amount: number) => void;
  setEstimatedDate: (date: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateItemQty: (index: number, qty: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getRemaining: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: 'Umum',
  customerId: null,
  discountAmount: 0,
  payAmount: 0,
  estimatedDoneAt: '',

  setCustomer: (customerId, customerName) => set({ customerId, customerName }),
  setDiscount: (discountAmount) => set({ discountAmount }),
  setPayAmount: (payAmount) => set({ payAmount }),
  setEstimatedDate: (estimatedDoneAt) => set({ estimatedDoneAt }),

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) => set((state) => ({ items: state.items.filter((_, i) => i !== index) })),
  updateItemQty: (index, qty) =>
    set((state) => {
      const next = [...state.items];
      if (next[index]) {
        next[index].qty = qty;
        const addonsTotal = next[index].addons.reduce((acc, a) => acc + a.price * a.qty, 0);
        next[index].subtotal = (next[index].unit_price + addonsTotal) * qty;
      }
      return { items: next };
    }),
  clearCart: () => set({ items: [], discountAmount: 0, payAmount: 0, customerName: 'Umum', customerId: null }),

  getSubtotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
  getTotal: () => Math.max(0, get().getSubtotal() - get().discountAmount),
  getRemaining: () => Math.max(0, get().getTotal() - get().payAmount),
}));
```

---

## 4. Fitur-Fitur Istimewa & Sangat Berguna (*Killer Features*)

Berikut fitur-fitur penting yang wajib di-highlight pada antarmuka frontend:

### 1. 🎛️ Smart Price Selector (Fixed / Range / Custom)
- **Produk FIXED**: Harga langsung terkunci, kasir cukup mengisi kuantitas.
- **Produk RANGE**: Muncul modal / slider interaktif yang membatasi harga antara $\text{min\_price}$ dan $\text{max\_price}$ (misal: Banner 10k–15k). Kasir tidak bisa input harga di luar batas toleransi toko.
- **Produk CUSTOM**: Kasir dapat mengetik harga kesepakatan secara leluasa (contoh: Box Makanan, Kalender Khusus).
- **Minimum Order Indicator**: Jika kasir input qty di bawah `min_order`, tombol checkout menampilkan peringatan visual kuning/merah.

### 2. 📋 Production Kanban Board / Job Tracker (Alur Produksi)
- Menampilkan pesanan dalam 4 kolom visual: **ANTRIAN** ➔ **PROSES** ➔ **SELESAI** ➔ **DIAMBIL**.
- **Fitur Drag-and-Drop / 1-Click Status Advance**: Kasir / tim produksi cukup mengklik tombol "Lanjut ke Proses" atau "Selesai" untuk memperbarui status pesanan.
- **🚨 Overdue Job Badge**: Jika tanggal hari ini $>$ `estimated_done_at` dan status belum `SELESAI`, kartu pesanan otomatis berubah warna merah menyala (*Overdue Warning*).

### 3. 💳 Quick DP & Pelunasan Piutang (*Instant Settlement*)
- Pelanggan yang bayar DP (Uang Muka) otomatis ditandai `DP` dan menyisakan piutang.
- Saat pelanggan datang mengambil pesanan di kolom **SELESAI**, kasir cukup klik tombol **"Pelunasan"** $\rightarrow$ Muncul pop-up nominal sisa tagihan $\rightarrow$ Klik **"Lunas & Serahkan"** $\rightarrow$ Status transaksi otomatis menjadi `PAID` dan order menjadi `DIAMBIL`.

### 4. 🖨️ Direct Thermal Receipt Printing (58mm & 80mm)
- Integrasi tombol **"Cetak Nota Thermal"** yang langsung memanggil endpoint `/transactions/:id/invoice`.
- Menyertakan stylesheet `@media print` sehingga tampilan struk terformat rapi sesuai kertas kasir thermal (termasuk nomor invoice barcode, rincian varian + add-ons, status DP, sisa piutang, dan estimasi waktu selesai).

### 5. ⚠️ Low Stock Alert & Quick Restock Modal
- Di pojok navigasi atau halaman inventaris, tampilkan badge merah untuk bahan baku yang sisa stoknya $\le$ `min_stock_warning`.
- Klik bahan tersebut untuk membuka **Quick Restock Modal** (mencatat mutasi `IN` dalam 2 detik).

### 6. 📊 Dashboard Analytics Visual
- Menampilkan grafik penjualan harian (*Line / Bar Chart* menggunakan Chart.js atau Recharts).
- Kartu ringkasan metrik: **Total Omset**, **Total Piutang (DP Belum Lunas)**, **Pesanan Aktif**, dan **Bahan Menipis**.
- Tabel **Top 5 Produk Terlaris** untuk panduan kulakan bahan baku percetakan.

---

## 5. Tahapan Pengerjaan Frontend yang Direkomendasikan (*Sprint Plan*)

1. **Sprint 1: Setup Proyek, Axios Client, Auth & Layout**
   - Setup Tailwind / CSS Tokens, Router, Axios instance dengan cookies.
   - Halaman Login & Proteksi Route (SuperAdmin vs Kasir).
2. **Sprint 2: Master Data & Inventaris**
   - CRUD Kategori Produk & Kategori Bahan.
   - CRUD Produk, Varian bertingkat, dan Add-ons.
   - Halaman Inventaris Stok Bahan Baku + Modal Mutasi IN/OUT.
3. **Sprint 3: Modul Kasir POS & Transaksi**
   - Katalog produk kasir (Grid kartu produk + filter kategori & pencarian).
   - Modal Range Price Picker & Addon Selector.
   - Sidebar Keranjang Belanja (Diskon, DP, Estimasi Selesai, Checkout).
   - Modal & Komponen Cetak Struk Thermal.
4. **Sprint 4: Job Status Tracking & Pelanggan**
   - Kanban Board tracking pengerjaan (`ANTRIAN` $\rightarrow$ `PROSES` $\rightarrow$ `SELESAI` $\rightarrow$ `DIAMBIL`).
   - Modal Pelunasan DP Instan.
   - Manajemen master data pelanggan & pencarian nomor HP.
5. **Sprint 5: Laporan, Dashboard & Finishing**
   - Dashboard ringkasan omset, piutang, dan grafik penjualan.
   - Pengujian end-to-end alur kasir & polesan antarmuka UI/UX.

---

*Dokumen ini dibuat sebagai panduan resmi pengembangan frontend Percetakan Perdana.*
