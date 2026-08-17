# API Contract Specification (Revisi 3)

## Base URL
`http://localhost:8080/api/v1`

## Autentikasi
Semua endpoint **wajib** menyertakan header `Authorization: Bearer <token>` kecuali `POST /auth/login` dan `GET /health`.
Token berupa JWT berisi claim `user_id`, `role` (`SUPER_ADMIN` / `ADMIN`), dan `exp`.
Endpoint yang ditandai **(Super Admin)** akan menolak request dari role `ADMIN` dengan `403 Forbidden`.

## Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Deskripsi singkat",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Deskripsi error singkat",
  "errors": { "field_name": ["pesan validasi"] }
}
```
Gunakan status code standar: `400` (validasi), `401` (belum login/token invalid), `403` (tidak punya akses), `404` (data tidak ditemukan), `409` (konflik, mis. username sudah ada / stok tidak cukup), `500` (server error).

## Pagination Standard
Endpoint list mendukung query `?page=1&limit=20`. Response list membungkus data dengan meta:
```json
{
  "success": true,
  "data": { "items": [], "page": 1, "limit": 20, "total": 0 }
}
```

---

## Endpoints

### Health Check
- `GET /health` -> Cek ketersediaan server & koneksi database.

### Auth
- `POST /auth/login` -> body `{ username, password }` -> data: `{ token, expires_at, user: { id, name, role } }`.
- `POST /auth/logout` -> invalidasi sesi (jika pakai refresh-token/blacklist di DB) atau sekadar konfirmasi bagi klien untuk menghapus token tersimpan.
- `GET /auth/me` -> data user yang sedang login (dari token).
- `POST /auth/refresh` -> perpanjang token yang mendekati kadaluarsa (opsional, tergantung strategi JWT yang dipakai — lihat catatan di AGENTS.md).

### Users (Super Admin)
- `GET /users` -> list akun (Admin & Super Admin).
- `POST /users` -> buat akun baru.
- `GET /users/:id` -> detail akun.
- `PUT /users/:id` -> ubah nama/role akun.
- `PATCH /users/:id/reset-password` -> reset password akun (mis. saat kasir lupa password).
- `DELETE /users/:id` -> nonaktifkan/hapus akun.

### Product Categories
- `GET /product-categories`
- `POST /product-categories` (Super Admin)
- `PUT /product-categories/:id` (Super Admin)
- `DELETE /product-categories/:id` (Super Admin)

### Raw Material Categories
- `GET /raw-material-categories`
- `POST /raw-material-categories` (Super Admin)
- `PUT /raw-material-categories/:id` (Super Admin)
- `DELETE /raw-material-categories/:id` (Super Admin)

### Products, Variants & Addons
- `GET /products` -> katalog jasa cetak (include `variants[]` jika `has_variants = true`).
- `POST /products` (Super Admin)
- `PUT /products/:id` (Super Admin)
- `DELETE /products/:id` (Super Admin)
- `GET /products/:id/variants`
- `POST /products/:id/variants` (Super Admin)
- `PUT /products/:id/variants/:variant_id` (Super Admin)
- `DELETE /products/:id/variants/:variant_id` (Super Admin)
- `GET /addons` -> termasuk `price_type`, `min_price`, `max_price` untuk addon rentang.
- `POST /addons` (Super Admin)
- `PUT /addons/:id` (Super Admin)
- `DELETE /addons/:id` (Super Admin)

### Inventory / Raw Materials
- `GET /raw-materials` -> support query `low_stock=true`, `category_id`.
- `GET /raw-materials/:id`
- `POST /raw-materials` (Super Admin) -> tambah master bahan baru.
- `PUT /raw-materials/:id` (Super Admin)
- `POST /raw-materials/mutations` -> catat stok masuk/keluar.
- `GET /raw-materials/:id/mutations` -> riwayat mutasi satu bahan.

### Customers
- `GET /customers` -> support query `search`.
- `POST /customers`
- `PUT /customers/:id`
- `GET /customers/:id/transactions` -> riwayat transaksi seorang pelanggan.

### Transactions (POS)
- `GET /transactions` -> support query `search`, `date`, `payment_status`, `order_status`, `page`, `limit`.
- `POST /transactions` -> body termasuk `discount_amount`, `estimated_done_at` (opsional).
- `GET /transactions/:id` -> detail transaksi beserta item & add-on.
- `PATCH /transactions/:id/status` -> update status produksi.
- `PATCH /transactions/:id/payment` -> update status pembayaran / catat pelunasan sisa DP.
- `DELETE /transactions/:id` (Super Admin) -> batalkan transaksi (soft delete, stok yang sudah terpakai idealnya tidak otomatis dikembalikan — perlu konfirmasi manual).

### Reports
- `GET /reports/revenue` -> support query `range=today|week|month|custom&start=&end=`.
- `GET /reports/receivables` -> daftar transaksi `payment_status=DP` beserta sisa tagihan.
- `GET /reports/best-sellers` -> ranking produk berdasarkan qty/omset dalam periode.
- `GET /reports/low-stock` -> daftar bahan baku di bawah ambang minimum.
