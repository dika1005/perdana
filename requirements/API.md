# API Contract Specification (Revisi 3)

## Base URL
`http://localhost:8080/api/v1`

## Response Format Standard

**Sukses:**
```json
{
  "success": true,
  "message": "Deskripsi singkat",
  "data": {}
}
```

**Gagal (Baru — distandarkan):**
```json
{
  "success": false,
  "message": "Deskripsi error yang bisa ditampilkan ke user",
  "errors": {
    "field_name": ["pesan validasi spesifik"]
  }
}
```
Kode status HTTP yang dipakai: `400` (validasi), `401` (belum login/token invalid), `403` (role tidak diizinkan), `404` (data tidak ditemukan), `409` (konflik, mis. username sudah dipakai), `500` (server error).

## Pagination Standard (Baru)
Endpoint list (`GET /products`, `GET /transactions`, `GET /raw-materials`, dll) mendukung query `page` (default 1) dan `per_page` (default 20, max 100). Response list membungkus data dengan meta:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 20, "total": 134 }
}
```

## Auth (Baru)
* `POST /auth/login` -> body `{ username, password }`, return JWT access token + data user (id, name, role). Password diverifikasi via bcrypt hash.
* `POST /auth/logout` -> invalidasi token di sisi client (dan blacklist di server jika dipakai refresh token).
* `POST /auth/refresh` -> tukar refresh token dengan access token baru (opsional, jika access token dibuat berumur pendek).
* `GET /auth/me` -> ambil data user yang sedang login dari token aktif.

Semua endpoint di bawah ini (kecuali `/health` dan `/auth/login`) wajib menyertakan header `Authorization: Bearer <token>`.

## User Management (Baru — Super Admin only)
* `GET /users` -> list akun (Admin & Super Admin).
* `POST /users` -> tambah akun baru.
* `PUT /users/:id` -> update nama/role.
* `PATCH /users/:id/password` -> reset password user lain.
* `DELETE /users/:id` -> nonaktifkan akun (soft delete, bukan hard delete, agar riwayat transaksi `created_by` tetap valid).

## Product & Raw Material Categories (Baru)
* `GET /product-categories`, `POST /product-categories`, `PUT /product-categories/:id`, `DELETE /product-categories/:id`.
* `GET /raw-material-categories`, `POST /raw-material-categories`, `PUT /raw-material-categories/:id`, `DELETE /raw-material-categories/:id`.

## Products, Variants & Addons
* `GET /products` -> Ambil katalog jasa cetak (include `variants[]` jika `has_variants = true`). Support query `category_id`, `search`.
* `POST /products` -> Tambah produk (Super Admin).
* `PUT /products/:id` -> Update produk (Super Admin).
* `DELETE /products/:id` -> Hapus/nonaktifkan produk (Super Admin).
* `GET /products/:id/variants` -> Ambil daftar varian sebuah produk.
* `POST /products/:id/variants` -> Tambah varian produk (Super Admin).
* `PUT /product-variants/:id` / `DELETE /product-variants/:id` -> Update/hapus varian.
* `GET /addons` -> Ambil daftar add-on (termasuk `price_type`, `min_price`, `max_price` untuk addon rentang).
* `POST /addons`, `PUT /addons/:id`, `DELETE /addons/:id` -> Kelola add-on (Super Admin).

## Inventory / Raw Materials
* `GET /raw-materials` -> List bahan mentah & sisa stok (query `low_stock=true` untuk filter di bawah ambang minimum, `category_id`, `search`).
* `POST /raw-materials` -> Tambah master bahan baru (Super Admin).
* `PUT /raw-materials/:id` -> Update master bahan (nama, satuan, ambang minimum) (Super Admin).
* `POST /raw-materials/mutations` -> Catat stok masuk/keluar.
* `GET /raw-materials/:id/mutations` -> Riwayat mutasi stok satu bahan.

## Customers
* `GET /customers` -> List pelanggan (query `search`).
* `POST /customers` -> Tambah pelanggan baru.
* `GET /customers/:id/transactions` -> Riwayat transaksi seorang pelanggan.

## Transactions (POS)
* `GET /transactions` -> List riwayat transaksi (query `search`, `date`, `payment_status`, `order_status`, `page`, `per_page`).
* `POST /transactions` -> Buat transaksi kasir baru (body termasuk `discount_amount`, `estimated_done_at` opsional).
* `GET /transactions/:id` -> Detail transaksi beserta item & add-on.
* `PATCH /transactions/:id/status` -> Update status produksi (`ANTRIAN`/`PROSES`/`SELESAI`/`DIAMBIL`).
* `PATCH /transactions/:id/payment` -> Update status pembayaran / catat pelunasan sisa DP.
* `GET /transactions/:id/invoice` -> Generate nota (format cetak thermal / PDF) untuk transaksi tersebut (Baru).

## Reports
* `GET /reports/revenue` -> Laporan omset (query `period=daily|weekly|monthly`, `start_date`, `end_date`).
* `GET /reports/receivables` -> Laporan piutang: daftar transaksi berstatus `DP` beserta sisa tagihan.
* `GET /reports/best-sellers` -> Ranking produk berdasarkan qty/omset dalam periode tertentu.
* `GET /reports/low-stock` -> Daftar bahan baku di bawah ambang minimum.

## Health Check
* `GET /health` -> Cek ketersediaan server & koneksi database.
