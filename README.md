<div align="center">

# 🖨️ PERDANA PRINTING & POS SYSTEM

**Sistem Point of Sale (POS) Khusus Percetakan Digital & Offset Terintegrasi AI Smart Order, Pelacakan Produksi, dan Showcase Publik**

[![Rust](https://img.shields.io/badge/Backend-Rust_Actix--Web-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![SeaORM](https://img.shields.io/badge/ORM-SeaORM-3b82f6?style=for-the-badge)](https://www.sea-ql.org/SeaORM/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_/_MariaDB-4479A1?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75FF?style=for-the-badge&logo=google)](https://ai.google.dev/)

[Fitur Utama](#-fitur-utama) • [Arsitektur Sistem](#-arsitektur-sistem) • [Panduan Instalasi](#-panduan-instalasi--menjalankan) • [Dokumentasi API](#-dokumentasi-api-swagger) • [Variabel Lingkungan](#-konfigurasi-environment)

---

</div>

## 📖 Tentang Aplikasi

**Perdana POS & Printing** adalah platform manajemen bisnis dan kasir modern yang dirancang khusus untuk memenuhi kebutuhan industri **Percetakan Digital (Digital Printing), Offset, dan Sablon/Merchandise**. 

Sistem ini menggabungkan landing page showcase produk publik untuk pelanggan, kasir POS dengan perhitungan dinamis per meter ($P \times L$), integrasi **AI Gemini** untuk parsing chat pesanan WhatsApp otomatis, manajemen pelacakan antrean produksi (*Job Tracking*), pengelolaan stok bahan baku, hingga laporan finansial eksekutif.

---

## ✨ Fitur Utama

### 1. 🌐 Showcase & Katalog Publik (`/`)
- **Showcase Interaktif**: Tampilan katalog elegan, responsif, dan ramah pengguna (*user-friendly*) tanpa kewajiban login bagi calon pelanggan.
- **Kategori Layanan Percetakan**: Penjelasan lengkap layanan cetak (Spanduk/Banner, Stiker Vinyl/Chromo, Kartu Nama/ID Card, Brosur/Flyer, Undangan/Souvenir, Buku Yasin & Penjilidan).
- **Filter & Sortir Multi-Kriteria**: Penyaringan instan berdasarkan kategori, nama (A-Z), harga (termurah/termahal), dan tipe ukuran meteran ($P \times L$).
- **Direct Order WhatsApp**: Tombol pesan cepat yang langsung membuat tautan pesan WhatsApp dengan format pesanan rapi ke nomor admin toko.
- **Dukungan Dark & Light Mode**: Skema warna kontras tinggi anti-silau di segala kondisi pencahayaan.

### 2. ⚡ AI Smart Order (WhatsApp Chat Parser)
- Fitur asisten kasir berbasis **Google Gemini AI**.
- Kasir cukup menyalin (*copy-paste*) pesan chat pesanan pelanggan dari WhatsApp ke dialog AI Smart Order.
- AI secara otomatis mengekstrak nama pelanggan, produk yang dimaksud, dimensi panjang $\times$ lebar (jika ada), jumlah, serta catatan pesanan dan langsung memasukkannya ke dalam keranjang kasir POS.

### 3. 🛒 Kasir POS Spesialis Percetakan (`/pos`)
- **Dukungan Dua Tipe Produk**:
  - **Produk Satuan (Pcs)**: Brosur, mug, kartu nama, kalender, pin, merchandise.
  - **Produk Kustom Meteran ($P \times L$)**: Spanduk Flexi, banner, baliho, stiker meteran dengan kalkulasi luas otomatis ($m^2 \times \text{harga}$).
- **Skema Pembayaran Fleksibel**: Lunas (*PAID*), Uang Muka / DP (*PARTIAL*), dan Belum Bayar (*UNPAID*).
- **Struk Thermal**: Cetak struk kasir ukuran 58mm atau 80mm langsung ke printer thermal.

### 4. 📋 Pelacakan Status Produksi / Job Tracking (`/tracking`)
- Siklus hidup pesanan lengkap: `PENDING` ➔ `IN_PROGRESS` ➔ `COMPLETED` ➔ `CANCELLED`.
- Penentuan tingkat prioritas pesanan (*LOW*, *MEDIUM*, *HIGH*, *URGENT*).
- Estimasi tanggal & jam selesai produksi dengan catatan operator cetak.

### 5. 📦 Manajemen Bahan Baku & HPP (`/inventory`)
- Pengelolaan stok material cetak (misal: Roll Flexi 280g/340g/440g, Tinta Solvent/Eco, Kertas Art Paper, Lem Panas, Spiral).
- Notifikasi peringatan stok menipis (*Low Stock Alert*).
- Riwayat pergerakan keluar-masuk barang.

### 6. 📊 Dashboard Finansial & Laporan (`/dashboard`, `/reports`)
- Grafik pendapatan harian dan bulanan secara interaktif (*Recharts*).
- Rekapitulasi produk terlaris (*Top-Selling Products*).
- Ringkasan piutang (*Pending Balance/DP*) dan laba kotor.

### 7. 🔒 Keamanan & Multi-Role Access Control
- Autentikasi berbasis **JWT Token** yang disimpan secara aman dalam **HttpOnly Cookie**.
- Hashing kata sandi menggunakan algoritma **bcrypt**.
- Level pengguna: **Superadmin / Owner** dan **Kasir / Operator**.

---

## 🏗️ Arsitektur Sistem

Aplikasi ini dibangun menggunakan arsitektur monorepo yang modular dan terisolasi:

```
perdana/
├── apps/
│   ├── backend/               # Rust (Actix-Web, SeaORM, Swagger UI, Gemini AI)
│   │   ├── src/
│   │   │   ├── config/        # Konfigurasi App & Database Connection
│   │   │   ├── extractors/    # JWT Auth Extractor (HttpOnly Cookie)
│   │   │   ├── routes/        # Endpoint API (public, auth, pos, reports, dll)
│   │   │   ├── services/      # Business logic & AI Service
│   │   │   ├── state.rs       # Shared AppState (DB Pool & Config)
│   │   │   └── main.rs        # Server Entrypoint
│   │   └── Cargo.toml
│   │
│   └── frontend/              # Next.js 15 (App Router, TypeScript, Tailwind CSS)
│       ├── next.config.ts     # Next.js Server-Side API Reverse Proxy Rewrites
│       ├── src/
│       │   ├── api/           # Axios API Client & Error Interceptor
│       │   ├── app/           # App Router Pages (/page, /login, /dashboard, /pos, dll)
│       │   ├── components/    # Reusable UI Layouts, Navbar, & Sidebar
│       │   ├── services/      # Frontend API Services
│       │   └── types/         # TypeScript Interfaces & Lucide Declarations
│       └── package.json
│
├── packages/
│   ├── entity/                # SeaORM Entity Models (Database Tables)
│   └── migration/             # SeaORM Database Migration Scripts
│
├── .env.example               # Template Konfigurasi Environment
└── README.md
```

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat Sistem
- **Rust Toolchain**: `cargo` versi 1.80+ ([Install Rust](https://rustup.rs/))
- **Node.js**: versi 20+ ([Install Node.js](https://nodejs.org/))
- **Database**: MySQL versi 8.0+ atau MariaDB 10.5+

---

### Langkah 1: Kloning Repositori & Persiapan Database

```bash
git clone https://github.com/dika1005/perdana.git
cd perdana
```

Buat database baru di MySQL/MariaDB:
```sql
CREATE DATABASE perdana_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Langkah 2: Konfigurasi Environment (`.env`)

Salin file `.env.example` ke `.env` di root direktori:
```bash
cp .env.example .env
```

Sesuaikan variabel berikut di dalam `.env`:
```env
# Database Connection
DATABASE_URL=mysql://root:password@127.0.0.1:3306/perdana_pos

# Server Backend
HOST=127.0.0.1
PORT=8800
RUST_LOG=info

# Keamanan JWT
JWT_SECRET=rahasia_kunci_jwt_super_aman_minimal_32_karakter
JWT_EXPIRATION_HOURS=24

# Google Gemini AI (Untuk Fitur Smart Order)
GEMINI_API_KEY=your_gemini_api_key_here

# Identitas Toko
STORE_NAME="PERDANA PRINTING & POS"
STORE_ADDRESS="Jl. Percetakan Perdana No. 1, Kota"
STORE_PHONE="0812-3456-7890"

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=/api/v1
BACKEND_INTERNAL_URL=http://127.0.0.1:8800
```

---

### Langkah 3: Menjalankan Migrasi Database

Jalankan migrasi SeaORM untuk membuat struktur tabel dan relasi secara otomatis:
```bash
cargo run -p migration
```

---

### Langkah 4: Menjalankan Backend (Actix Web)

```bash
cargo run --bin backend
```
Backend akan aktif di `http://127.0.0.1:8800`.
> Akun awal Superadmin otomatis dibuat saat pertama kali backend dijalankan:
> - **Username**: `superadmin`
> - **Password**: `superadmin123`

---

### Langkah 5: Menjalankan Frontend (Next.js)

Buka terminal baru di direktori `apps/frontend`:
```bash
cd apps/frontend
npm install
npm run dev
```

Buka browser Anda dan akses:
- **Landing Page Publik**: [http://localhost:3000/](http://localhost:3000/)
- **Halaman Login Kasir**: [http://localhost:3000/login](http://localhost:3000/login)
- **Dashboard Bisnis**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Kasir POS**: [http://localhost:3000/pos](http://localhost:3000/pos)

---

## 📡 Dokumentasi API (Swagger)

Backend Actix Web telah terintegrasi dengan **Utoipa Swagger UI**. Anda dapat melihat seluruh spesifikasi REST API, schema request/response, dan mencoba endpoint secara interaktif di:

👉 **[http://127.0.0.1:8800/swagger-ui/](http://127.0.0.1:8800/swagger-ui/)**

### Rangkuman Rute Utama:

| Modul | Method | Endpoint | Keterangan |
|---|---|---|---|
| **Public** | `GET` | `/api/v1/public/catalog` | Data katalog produk & info toko (Tanpa Auth) |
| **Auth** | `POST` | `/api/v1/auth/login` | Login user & set cookie JWT |
| **Auth** | `POST` | `/api/v1/auth/logout` | Logout user & hapus cookie JWT |
| **Products** | `GET` / `POST` | `/api/v1/products` | Manajemen master produk & varian harga |
| **Transactions** | `GET` / `POST` | `/api/v1/transactions` | Transaksi POS, kalkulasi PxL, & simpan pesanan |
| **Tracking** | `GET` / `PUT` | `/api/v1/transactions/{id}/status` | Update status produksi pesanan |
| **AI** | `POST` | `/api/v1/ai/parse-order` | Parsing chat WhatsApp ke keranjang belanja POS |
| **Reports** | `GET` | `/api/v1/reports/summary` | Ringkasan omzet, laba, dan transaksi |
| **Inventory** | `GET` / `POST` | `/api/v1/raw-materials` | Pengelolaan bahan baku & stok |

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
|---|---|
| **Bahasa Pemrograman** | Rust (Backend), TypeScript (Frontend) |
| **Backend Framework** | Actix-Web 4.x |
| **Database ORM** | SeaORM 1.1 (Async ORM untuk Rust) |
| **Database Engine** | MySQL 8 / MariaDB |
| **AI Engine** | Google Gemini Generative AI REST API |
| **Frontend Framework** | Next.js 15 (React 19, App Router) |
| **Styling & Icons** | Tailwind CSS, Skeuomorphism UI, Lucide Icons |
| **Visualisasi Data** | Recharts |
| **Dokumentasi API** | OpenAPI 3.0 / Utoipa Swagger UI |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT License](LICENSE).
Dikembangkan untuk kebutuhan operasional percetakan digital dan kasir modern.
