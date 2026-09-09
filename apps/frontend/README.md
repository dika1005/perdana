# Perdana POS — Frontend (Next.js)

Frontend dari aplikasi kasir & manajemen operasional **Perdana Printing**. Dibangun dengan Next.js (App Router), TypeScript, Tailwind CSS v4, TanStack Query, Zustand, dan Recharts.

Backend (Rust/Actix-Web) ada di `apps/backend`, dan definisi skema database di `packages/entity`.

## Menjalankan di lokal

1. Pastikan backend aktif (lihat `apps/backend`) di `http://127.0.0.1:8800`.
2. Dari folder ini:

```bash
npm install
npm run dev
```

3. Buka `http://localhost:3000`.

Base URL API backend didefinisikan lewat env var `NEXT_PUBLIC_API_BASE_URL`; default-nya `/api/v1` (cocok untuk mode di mana frontend dan backend dilayani lewat reverse-proxy yang sama, mis. Caddy/VPS).

## Halaman utama

| Route | Halaman |
| --- | --- |
| `/` | Landing page publik: katalog, harga, dan info workshop |
| `/login` | Login kasir / owner |
| `/pos` | Kasir POS (katalog, keranjang, checkout) |
| `/tracking` | Kanban job tracking produksi |
| `/cek-pesanan` | Lacak pesanan oleh pelanggan (publik) |
| `/dashboard` | Dashboard ringkasan omset & stok |
| `/inventory` | Inventaris bahan baku |
| `/customers` | Data pelanggan |
| `/expenses` | Catatan pengeluaran (kas keluar) |
| `/reports` | Laporan transaksi |
| `/transactions` | Riwayat transaksi + cetak ulang nota |
| `/products` | Master produk & finishing (owner) |
| `/users` | Manajemen akun kasir (owner) |

## Build produksi

```bash
npm run build
```

Hasil build Next.js standalone digunakan di `docker-compose.prod.yml`.

## Struktur

- `src/app/*` — halaman (App Router)
- `src/components/*` — komponen UI per fitur (`pos`, `inventory`, `tracking`, `landing`, `shared`, dll)
- `src/services/*` + `src/api/*` — pemanggilan API backend (axios)
- `src/stores/` — state client (Zustand)
- `src/data/` — data statis (katalog landing, metode pembayaran, identitas toko)
