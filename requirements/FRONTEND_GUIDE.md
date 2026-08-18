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

## 4. Spesifikasi & Daftar Tampilan (UI Screens) yang Harus Dibuat

Berikut rincian lengkap setiap layar/halaman, komponen, interaksi pengguna, dan hak akses yang wajib dibangun pada frontend:

```mermaid
graph TD
    Login["1. Halaman Login (/login)"] --> AppLayout["Layout Utama (Sidebar + Header)"]
    
    subgraph Kasir & Owner
        AppLayout --> POS["2. Kasir POS (/pos)"]
        AppLayout --> Tracking["3. Job Tracking (/job-tracking)"]
        AppLayout --> TransHistory["4. Riwayat Transaksi (/transactions)"]
        AppLayout --> Inventory["5. Inventaris Bahan Baku (/inventory)"]
        AppLayout --> Customers["6. Pelanggan & Repeat Order (/customers)"]
        AppLayout --> Reports["7. Laporan & Dashboard (/reports)"]
    end

    subgraph Owner Only (SUPER_ADMIN)
        AppLayout --> MasterProducts["8. Master Produk & Finishing (/products)"]
        AppLayout --> Users["9. Manajemen Pengguna / Kasir (/users)"]
    end
```

---

### 1. 🔐 Halaman Login (`/login`)
- **Akses**: Publik (Bebas).
- **Elemen UI**:
  - Logo toko & Judul "Perdana POS & Percetakan".
  - Form Input: `Username` dan `Password`.
  - Tombol Submit: "Masuk ke Sistem" (dengan animasi spinner loading).
  - Pesan error interaktif jika kredensial salah atau akun dinonaktifkan.
- **Logika & State**:
  - Panggil `POST /auth/login` dengan opsi `withCredentials: true`.
  - Backend otomatis menyetel HttpOnly cookie `access_token` dan `refresh_token`.
  - Simpan data profil (`name`, `username`, `role`) di Zustand `useAuthStore`.
  - Redirect otomatis ke `/pos` (untuk Kasir) atau `/reports` (untuk Owner).

---

### 2. 🖥️ Layout Utama & Shell Navigasi
- **Komponen**:
  - **Sidebar Navigasi**:
    - Menu Kasir POS, Job Tracking, Riwayat Transaksi, Inventaris Bahan, Pelanggan, Laporan.
    - Menu Khusus Super Admin (Owner): Master Produk & Finishing, Kelola Kasir.
    - Indikator profil pengguna aktif & tombol **Logout** (`POST /auth/logout`).
  - **Top Header**:
    - Judul halaman dinamis + tanggal hari ini.
    - **Badge Notifikasi Stok Kritis** (menampilkan jumlah bahan yang $\le$ `min_stock_warning` dari `GET /reports/low-stock`).
    - Status role badge (`SUPER ADMIN` / `KASIR`).
  - **RoleGuard Wrapper**: Komponen pelindung rute yang otomatis me-redirect kasir jika mencoba membuka halaman khusus Owner (`/products`, `/users`).

---

### 3. 🛒 Halaman Kasir POS (`/pos` atau `/`) — *Layar Utama Kasir*
Layar operasional terpenting tempat kasir melayani pembeli secara cepat dan fleksibel.

- **Tata Letak (2 Kolom Responsif)**:
  - **Kolom Kiri (Katalog Produk)**:
    - Search bar cepat (pencarian nama produk / jasa cetak).
    - Tabs Kategori (Semua, Buku Yasin, Undangan, Spanduk/Banner, Brosur, Stiker, Souvenir).
    - Grid Kartu Produk: Menampilkan nama, harga (atau label "Harga Rentang" / "Custom"), info minimum order, dan tombol pilih.
  - **Kolom Kanan (Keranjang / Cart Drawer)**:
    - Pemilih Pelanggan: Dropdown pencarian pelanggan terdaftar (`SMK Negeri 1`, `Pak Haji Budi`) atau input instan `Umum`.
    - Daftar Item Terpilih:
      - Nama produk & varian terpilih.
      - Daftar Add-ons/Finishing yang menempel pada item.
      - Kontrol kuantitas ($+$ / $-$) dengan validasi minimum order (`min_order`).
      - Tombol hapus item dari keranjang.
    - Kalkulasi Keuangan Real-Time:
      - **Subtotal** (akumulasi harga item & addons).
      - **Input Diskon / Potongan Harga** (nominal Rp).
      - **Total Tagihan Akhir**.
      - **Input Jumlah Bayar (`pay_amount`)**:
        - Jika bayar penuh $\ge$ total tagihan $\rightarrow$ otomatis status `PAID` dan hitung **Kembalian**.
        - Jika bayar sebagian $\rightarrow$ otomatis status `DP` dan hitung **Sisa Piutang**.
      - **Input Estimasi Tanggal Selesai (`estimated_done_at`)**: Date picker perkiraan pesanan rampung.
    - Tombol Aksi: **"Proses Pembayaran & Cetak Nota"** (Disable jika keranjang kosong).

- **Modal Pendukung POS**:
  1. **Modal Konfigurasi Item & Varian**:
     - Memilih varian (contoh: *Buku Yasin 128 Hal Softcover* vs *176 Hal Hardcover*).
     - **Smart Range Price Slider/Input**: Jika produk/varian bertipe `RANGE`, input dibatasi antara `min_price` dan `max_price`.
     - **Kalkulator Spanduk/Banner (m²)**: Untuk produk custom, sediakan helper: $\text{Panjang (m)} \times \text{Lebar (m)} \times \text{Harga/m}^2$.
     - Checklist Add-ons/Finishing (Laminasi Glossy, Doff, Pond, Jilid Spiral, dsb).
  2. **Modal Sukses Checkout**:
     - Menampilkan kembalian, ringkasan invoice number (`INV-20260818-XXXX`), tombol "Cetak Struk Thermal", dan tombol "Transaksi Baru".

---

### 4. 📋 Halaman Job Tracking & Antrean Produksi (`/job-tracking`)
Layar untuk memantau progres pengerjaan pesanan percetakan dari cetak hingga selesai.

- **Tampilan Kanban Board (4 Kolom Status)**:
  1. **`ANTRIAN`**: Pesanan baru masuk dari kasir yang menunggu giliran cetak/desain.
  2. **`PROSES`**: Pesanan sedang diproduksi (dicetak di mesin / proses finishing).
  3. **`SELESAI`**: Pesanan sudah beres diproduksi dan siap diambil pelanggan.
  4. **`DIAMBIL`**: Pesanan sudah diserahkan ke pelanggan (arsip selesai).

- **Kartu Pesanan (Job Card)**:
  - Nomor Invoice, Nama Pelanggan, Kasir pembuat pesanan.
  - Ringkasan item yang dicetak (contoh: `Undangan Custom x 500 pcs (+ Laminasi Doff)`).
  - Status Pembayaran: Badge Hijau (`LUNAS`) atau Badge Kuning (`DP - Sisa Rp 250.000`).
  - Estimasi Selesai + **Badge Overdue Merah** jika tanggal hari ini melewati `estimated_done_at` dan pesanan belum selesai.
  - **Tombol Cepat Ubah Status**:
    - Di kolom Antrian: Tombol "Mulai Proses" $\rightarrow$ `PATCH /transactions/{id}/status` ke `PROSES`.
    - Di kolom Proses: Tombol "Tandai Selesai" $\rightarrow$ `PATCH /transactions/{id}/status` ke `SELESAI`.
    - Di kolom Selesai: Tombol "Serahkan ke Pelanggan" / **"Pelunasan & Serahkan"**.

- **Modal Pelunasan DP Instan**:
  - Dipicu saat kasir mengklik tombol serahkan pada pesanan yang masih berstatus `DP`.
  - Menampilkan sisa tagihan $\rightarrow$ Input nominal uang diterima $\rightarrow$ Submit ke `PATCH /transactions/{id}/payment` $\rightarrow$ Order otomatis lunas dan status berganti ke `DIAMBIL`.

---

### 5. 📜 Halaman Riwayat Transaksi (`/transactions`)
- **Elemen UI**:
  - Filter Bar: Pencarian nomor invoice/pelanggan, filter tanggal, filter status bayar (`PAID`, `DP`, `UNPAID`), dan filter status order.
  - Tabel Transaksi:
    - No. Invoice, Tanggal & Jam, Pelanggan, Kasir, Total Belanja, Bayar, Status Bayar, Status Order, Aksi.
  - Paginasi Server-Side (Halaman 1, 2, ..., Jumlah data per halaman 20/50/100).
- **Drawer / Modal Detail Transaksi**:
  - Rincian item produk, varian harga, detail add-ons dan kuantitasnya.
  - Tombol **"Cetak Ulang Nota"** (panggil `GET /transactions/{id}/invoice`).
  - Tombol **"Pelunasan Pembayaran"** (jika masih berstatus DP).

---

### 6. 🏷️ Halaman Master Produk & Finishing (`/products`) — *Khusus Owner*
- **Tab 1: Katalog Produk Cetak**:
  - Tabel master produk: Nama, Kategori, Tipe Harga (Fixed/Range/Custom), Harga Default / Rentang Harga, Minimum Order, Satuan (`pcs`, `rim`, `meter`, `lembar`).
  - Modal Tambah / Edit Produk: Form nama, pilihan kategori, radio button tipe harga, toggle varian, input minimum order.
- **Tab 2: Varian Produk**:
  - Pengaturan varian per produk (misal: Buku Yasin $\rightarrow$ Varian 128 HVS, 176 HVS, Hard Cover).
  - Form harga per varian (Fixed atau Range min-max).
- **Tab 3: Add-ons / Finishing**:
  - Master finishing cetak: Laminasi, Spot UV, Foil Emas, Pond, Jilid Spiral, Cutting.
  - Form tipe harga addon (Fixed atau Range).
- **Tab 4: Kategori Produk**:
  - Tambah, edit, dan hapus nama kategori produk cetak.

---

### 7. 📦 Halaman Inventaris Bahan Baku (`/inventory`)
- **Tabel Stok Bahan Baku**:
  - Nama Bahan (contoh: `Kertas Art Paper 260gr`, `Tinta Eco Solvent Cyan`, `Mika Jilid A4`).
  - Kategori Bahan, Varian Warna/Ukuran, Satuan (`rim`, `roll`, `kg`, `botol`, `lembar`).
  - **Stok Fisik Saat Ini**.
  - **Batas Minimum Peringatan (`min_stock_warning`)**.
  - **Status Stok**: Badge Hijau (`Aman`) atau Badge Merah Kritis (`Stok Menipis!`).
- **Modal Cepat Mutasi Stok (IN / OUT)**:
  - Kasir/Owner memilih jenis mutasi:
    - **`IN` (Stok Masuk / Restock)**: Input kuantitas masuk + catatan (contoh: "Kulakan dari Supplier ABC").
    - **`OUT` (Stok Keluar / Pemakaian / Rusak)**: Input kuantitas keluar + catatan (contoh: "Dipakai cetak 500 brosur").
  - Submit ke `POST /raw-materials/mutations` $\rightarrow$ stok terupdate otomatis.
- **Tab Riwayat Mutasi**:
  - Log kronologis mutasi bahan baku (Tanggal, Nama Bahan, Tipe IN/OUT, Jumlah, Catatan).
- **Tab Kategori Bahan Baku** (*Owner Only*):
  - CRUD kategori master bahan (Kertas, Tinta, Mika, Perekat, dsb).

---

### 8. 👥 Halaman Data Pelanggan (`/customers`)
- **Tabel Pelanggan**:
  - Nama Pelanggan, Nomor Telepon/WhatsApp (dengan tombol pintas kirim pesan WA), Alamat, Tanggal Terdaftar.
  - Search bar interaktif berdasarkan nama atau nomor HP.
  - Modal Tambah / Edit Pelanggan.
- **Drawer Riwayat Repeat Order Pelanggan**:
  - Dibuka saat mengklik salah satu pelanggan.
  - Memanggil `GET /customers/{id}/transactions`.
  - Menampilkan total omset yang disumbang pelanggan ini, daftar pesanan sebelumnya, status pesanan aktif, dan tanggal terakhir order.

---

### 9. 📈 Halaman Laporan & Analitik Finansial (`/reports`)
Layar eksekutif untuk melihat performa bisnis toko percetakan.

- **Filter Periode**: Date Range Picker (Hari Ini, 7 Hari Terakhir, Bulan Ini, Custom Tanggal).
- **Kartu KPI Ringkasan Dashboard (`GET /reports/summary`)**:
  1. 💰 **Total Omset Diterima**: Total uang riil yang sudah masuk kas.
  2. 📝 **Total Transaksi**: Jumlah transaksi yang terjadi pada periode tersebut.
  3. ⏳ **Total Piutang (DP Outstanding)**: Nominal uang yang masih tertunda di pelanggan.
  4. 🔄 **Pesanan Aktif**: Jumlah pesanan yang sedang di antrean / proses produksi.
  5. ⚠️ **Bahan Baku Menipis**: Jumlah jenis bahan baku yang berada di bawah ambang minimum.
- **Visualisasi & Sub-Laporan**:
  - **Grafik Tren Penjualan Harian (`GET /reports/daily-sales`)**: Bar / Line chart omset per hari.
  - **Tabel Top 5 Produk Terlaris (`GET /reports/top-products`)**: Rangking produk yang paling banyak dipesan beserta kontribusi revenue-nya.
  - **Laporan Piutang DP (`GET /reports/receivables`)**: Daftar invoice pelanggan yang belum melunasi pembayaran + tombol aksi pelunasan langsung.
  - **Laporan Bahan Baku Kritis (`GET /reports/low-stock`)**: Daftar bahan yang harus segera dibeli ke supplier.
  - **Laporan Agregasi Mutasi Stok (`GET /reports/inventory-mutations`)**: Rekap keluar-masuk seluruh bahan baku.

---

### 10. 👤 Halaman Manajemen Pengguna (`/users`) — *Khusus Owner*
- **Tabel Pengguna**:
  - Nama, Username, Role (`SUPER_ADMIN` / `ADMIN`), Status (`Aktif` / `Nonaktif`), Tanggal Dibuat.
- **Modal Tambah Kasir**:
  - Input Nama Lengkap, Username unik, Password awal (min 8 karakter), Role (Admin/Kasir).
- **Modal Reset Password Kasir**:
  - Owner dapat mengatur ulang kata sandi kasir jika lupa password.
- **Aksi Nonaktifkan Akun**:
  - Menonaktifkan akun kasir yang sudah tidak bekerja tanpa menghapus data riwayat transaksinya.

---

### 11. 🖨️ Komponen Cetak Nota Thermal Monospace (`ThermalReceiptPrint`)
Komponen cetak khusus yang otomatis terformat ke kertas thermal 58mm atau 80mm saat kasir menekan tombol cetak:

- **Struktur Konten Struk**:
  ```text
  ========================================
            PERDANA PRINTING & POS        
       Jl. Percetakan Perdana No. 1, Kota 
               Telp: 0812-3456-7890       
  ========================================
  No. Nota  : INV-20260818-8472
  Tanggal   : 18/08/2026 14:30
  Kasir     : Budi Santoso
  Pelanggan : SMK Negeri 1 (08123456789)
  Est. Jadi : 20/08/2026
  ----------------------------------------
  Undangan Softcover x 500 pcs   Rp 1.500.000
    + Laminasi Doff (500 pcs)    Rp   150.000
  Banner Flexi 280gr (2x1m)      Rp   100.000
  ----------------------------------------
  Subtotal                       Rp 1.750.000
  Diskon                         Rp   100.000
  TOTAL                          Rp 1.650.000
  BAYAR (DP)                     Rp 1.000.000
  ----------------------------------------
  SISA PIUTANG                   Rp   650.000
  Status Order: ANTRIAN PRODUKSI
  ========================================
    Terima kasih atas kepercayaan Anda!   
     Barang yang sudah dicetak tidak     
          dapat dikembalikan.             
  ========================================
  ```
- **Styling CSS Print**:
  ```css
  @media print {
    body * { visibility: hidden; }
    #thermal-receipt, #thermal-receipt * { visibility: visible; }
    #thermal-receipt {
      position: absolute;
      left: 0;
      top: 0;
      width: 58mm; /* atau 80mm */
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.2;
    }
  }
  ```

---

## 5. Fitur-Fitur Istimewa & Sangat Berguna (*Killer Features*)

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

## 6. Tahapan Pengerjaan Frontend yang Direkomendasikan (*Sprint Plan*)

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

