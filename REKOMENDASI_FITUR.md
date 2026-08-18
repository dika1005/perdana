# Ringkasan Audit API & Rekomendasi Fitur Perdana POS

Dokumen ini merangkum status seluruh API backend yang telah selesai dibuat serta daftar fitur/API lanjutan yang direkomendasikan untuk melengkapi ekosistem aplikasi **Perdana POS & Percetakan**.

---

## 1. Status Kesiapan API Backend Saat Ini

| Modul | Endpoint | Metode | Status | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Autentikasi** | `/api/v1/auth/login` | `POST` | Selesai | Login JWT & HttpOnly Cookie |
| | `/api/v1/auth/refresh` | `POST` | Selesai | Perpanjangan masa aktif token |
| | `/api/v1/auth/logout` | `POST` | Selesai | Hapus sesi & cookie |
| | `/api/v1/auth/me` | `GET` | Selesai | Profil pengguna yang sedang aktif |
| **Laporan & Dashboard** | `/api/v1/reports/summary` | `GET` | Selesai | Ringkasan omset, piutang, pesanan & stok |
| | `/api/v1/reports/daily-sales` | `GET` | Selesai | Tren grafik penjualan harian |
| | `/api/v1/reports/top-products` | `GET` | Selesai | Akumulasi produk terlaris |
| | `/api/v1/reports/inventory-mutations` | `GET` | Selesai | Rekap mutasi bahan baku (IN/OUT) |
| **Transaksi & POS** | `/api/v1/transactions` | `GET` / `POST` | Selesai | Buat pesanan baru & riwayat transaksi |
| | `/api/v1/transactions/{id}` | `GET` | Selesai | Detail transaksi |
| | `/api/v1/transactions/{id}/status` | `PATCH` | Selesai | Ubah status (`ANTRIAN` $\rightarrow$ `DIAMBIL`) |
| | `/api/v1/transactions/{id}/payment` | `PATCH` | Selesai | Pelunasan sisa tagihan / DP |
| | `/api/v1/transactions/{id}/invoice` | `GET` | Selesai | Data lengkap untuk cetak struk |
| **Inventaris Bahan** | `/api/v1/raw-materials` | `GET` / `POST` / `PUT` / `DELETE` | Selesai | CRUD master bahan baku |
| | `/api/v1/raw-materials/mutations` | `POST` | Selesai | Catat mutasi stok masuk / keluar |
| | `/api/v1/raw-materials/{id}/mutations` | `GET` | Selesai | Riwayat mutasi per bahan baku |
| **Pelanggan** | `/api/v1/customers` | `GET` / `POST` / `PUT` / `DELETE` | Selesai | CRUD master data pelanggan |
| **Produk & Addon** | `/api/v1/products` | `GET` / `POST` / `PUT` / `DELETE` | Selesai | CRUD produk katalog |
| | `/api/v1/product-categories` | `GET` / `POST` / `PUT` / `DELETE` | Selesai | CRUD kategori produk |
| | `/api/v1/addons` | `GET` / `POST` / `PUT` / `DELETE` | Selesai | CRUD opsi tambahan/finishing |
| **Manajemen User** | `/api/v1/users` | `GET` / `POST` / `PUT` / `DELETE` | Selesai | Kelola akun Admin & Super Admin |

---

## 2. Rekomendasi Fitur Lanjutan yang Diperlukan

Berikut adalah 5 fitur rekomendasi yang siap diimplementasikan untuk meningkatkan fungsionalitas dan kemudahan operasional kasir:

### 1. Modal Pelunasan Piutang / DP (Frontend)
* **Tujuan**: Memudahkan kasir saat pelanggan datang mengambil pesanan dan melunasi sisa pembayaran.
* **Integrasi API**: `PATCH /api/v1/transactions/{id}/payment`.
* **Lokasi UI**: Halaman **Laporan** atau **Job Tracking**.

### 2. Kalkulator Ukuran Banner / Spanduk (POS)
* **Tujuan**: Kasir cukup memasukkan dimensi **Panjang (m)** $\times$ **Lebar (m)** $\times$ **Harga per $\text{m}^2$**, sistem otomatis mengalikan dan mengisi total harga pesanan.
* **Integrasi API**: `custom_price` pada payload `/api/v1/transactions`.
* **Lokasi UI**: Halaman **Kasir POS** (`/pos`).

### 3. Halaman Manajemen Master Produk & Kategori (Frontend)
* **Tujuan**: Admin dapat menambah, mengubah harga, atau menghapus produk dan opsi finishing langsung dari web UI tanpa menyentuh database.
* **Integrasi API**: `/api/v1/products`, `/api/v1/product-categories`, dan `/api/v1/addons`.
* **Lokasi UI**: Menu baru **Produk** (`/products`) di Sidebar.

### 4. Tampilan Cetak Struk & Invoice Termal (Frontend)
* **Tujuan**: Menyediakan tampilan cetak struk kasir ukuran 58mm/80mm atau invoice A4 siap cetak (`window.print()`).
* **Integrasi API**: `/api/v1/transactions/{id}/invoice`.
* **Lokasi UI**: Modal sukses checkout pada halaman POS & menu Laporan.

### 5. Export Laporan ke Format Excel / CSV
* **Tujuan**: Men-download ringkasan penjualan bulanan atau riwayat transaksi ke file `.xlsx` / `.csv` untuk pembukuan akuntansi.
* **Integrasi**: Client-side parser atau endpoint ekspor.
* **Lokasi UI**: Tombol *Export Excel* pada halaman Laporan (`/reports`).

---

## 3. Kesimpulan Prioritas Pengembangan

| Prioritas | Fitur | Alasan Kebutuhan |
| :--- | :--- | :--- |
| 🔴 **Tinggi** | **Modal Pelunasan DP** | Alur pesanan DP belum memiliki tombol pelunasan di UI. |
| 🔴 **Tinggi** | **Kalkulator Ukuran di POS** | Krusial untuk perhitungan cetak spanduk / banner per meter. |
| 🟡 **Sedang** | **Kelola Master Produk (UI)** | Memudahkan penambahan variasi produk & harga baru. |
| 🟡 **Sedang** | **Cetak Struk / Invoice** | Diperlukan kasir untuk bukti transaksi pelanggan. |
| 🟢 **Rendah** | **Export Excel Laporan** | Kebutuhan pembukuan berkala / akhir bulan. |
