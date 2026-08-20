# 🖨️ Aplikasi Kasir & Manajemen Percetakan — PERDANA PRINTING

Aplikasi kasir (POS) dan pengelolaan operasional harian yang dirancang khusus untuk **Usaha Percetakan Digital, Sablon, Offset, dan Konveksi**. 

Sistem ini dibuat sangat mudah dipahami oleh kasir maupun pemilik toko, mulai dari perhitungan harga spanduk meteran otomatis, pembacaan pesanan langsung dari WhatsApp, pencatatan uang muka (DP), pelacakan antrian produksi, hingga laporan laba bersih dan kas keluar.

---

## 🌟 Panduan Fitur & Cara Kerja Aplikasi

Aplikasi ini memiliki 9 menu utama yang saling terhubung secara otomatis:

### 1. 🛒 Kasir POS (Point of Sale)
Halaman utama kasir untuk melayani transaksi di toko secara cepat:
* **Katalog Produk Cepat**: Klik produk untuk memasukkan ke keranjang belanja.
* **🧮 Kalkulator Spanduk Meteran**: Tidak perlu menghitung manual! Cukup masukkan **Panjang (meter) × Lebar (meter)**, harga total otomatis terhitung presisi sesuai tarif per meter².
* **📋 Baca Chat WhatsApp (AI Smart Order)**: Cukup salin (*copy-paste*) pesan chat pesanan dari pelanggan di WhatsApp, sistem otomatis membaca nama barang, ukuran, dan jumlahnya langsung ke keranjang.
* **Sistem Pembayaran Fleksibel**:
  * ✅ **Lunas**: Pembayaran penuh saat pemesanan.
  * 💰 **Uang Muka (DP)**: Catat uang muka awal, sisa tagihan otomatis tersimpan sebagai piutang.
  * ⏰ **Belum Bayar**: Pesanan tetap masuk antrian cetak, pembayaran dilakukan saat barang diambil.
* **Cetak Struk Thermal**: Langsung cetak nota belanja format struk kasir (ukuran 58mm / 80mm).

---

### 2. 📋 Antrian & Status Pesanan (Job Tracking)
Papan pantau (*kanban board*) agar bagian operator cetak dan kasir tahu perkembangan setiap pesanan:
* **Tahapan Jelas**: `🕐 Antrian Cetak` ➔ `⏳ Sedang Diproses` ➔ `✅ Selesai Dicetak` ➔ `🎉 Sudah Diambil`.
* **Notifikasi WhatsApp Sekali Klik**: Ketika status diubah ke *Selesai Dicetak*, muncul tombol kirim WhatsApp otomatis untuk mengabarkan pelanggan bahwa pesanannya sudah siap diambil beserta sisa tagihannya.
* **Pelunasan Saat Pengambilan**: Jika pesanan masih berstatus DP, kasir bisa langsung melunasi tagihan saat pelanggan datang mengambil barang.

---

### 3. 📜 Riwayat Transaksi & Pelunasan
* **Cari Nota Cepat**: Cari nota berdasarkan nomor invoice (`INV-...`) atau nama pelanggan.
* **Filter Lengkap**: Saring nota berdasarkan status pembayaran (Lunas / DP / Belum Bayar) dan tanggal transaksi.
* **Cetak Ulang Nota**: Kasir bisa melihat rincian nota lama dan mencetak ulang struk thermal kapan saja.
* **Tombol Lunasi**: Catat pelunasan sisa tagihan piutang pelanggan dengan mudah.

---

### 4. 💸 Catatan Pengeluaran (Kas Keluar)
Mencatat seluruh pengeluaran toko agar laporan keuntungan akhir akurat:
* **Kategori Pengeluaran**:
  * 🎨 **Bahan Baku**: Pembelian kertas, roll flexi, tinta, lem, dll.
  * ⚡ **Operasional**: Tagihan listrik, air, internet toko.
  * 👥 **Gaji & Upah**: Gaji karyawan atau upah lembur operator.
  * 🔧 **Perawatan Mesin**: Service mesin cetak, ganti sparepart.
  * 📦 **Lainnya**: Konsumsi toko, ATK, dll.
* **Metode Bayar**: Pencatatan uang tunai (*Cash*) atau transfer bank.

---

### 5. 👥 Master Pelanggan & Riwayat Repeat Order
* **Buku Kontak Pelanggan**: Menyimpan nama, nomor WhatsApp/HP, dan alamat pelanggan tetap.
* **Riwayat Belanja (Repeat Order)**: Klik nama pelanggan untuk melihat daftar riwayat transaksi dan nota yang pernah dipesan oleh pelanggan tersebut.

---

### 6. 📦 Inventaris Bahan Baku
* **Kontrol Stok Fisik**: Pantau stok kertas (Art Paper/Carton), roll flexi spanduk, stiker, dan tinta.
* **Peringatan Stok Menipis**: Sistem otomatis memberi tanda merah (*Kritis/Menipis*) jika stok bahan berada di bawah batas minimum yang ditentukan.
* **Mutasi Masuk (Restock)**: Tombol cepat untuk menambah stok saat baru membeli bahan baku dari supplier.

---

### 7. 🏷️ Master Produk & Finishing
* **Katalog Produk**: Atur produk dengan harga tetap (*Fixed*), produk meteran (*Custom*), maupun produk rentang (*Range* seperti undangan).
* **Aturan Minimum Order**: Produk seperti brosur/undangan dapat diset minimal pemesanan (misal min. 50 atau 100 lembar).
* **Pilihan Finishing / Add-on**: Tambahkan opsi pelengkap cetak seperti *Laminasi Doff/Glossy*, *Mata Ayam Banner*, atau *Potong Sudut Bulat*.

---

### 8. 📊 Laporan Omset & Laba Bersih
* **Ringkasan Keuangan**: Pantau Total Omset Penjualan, Total Pengeluaran Kas, Total Piutang Belum Lunas, dan **Laba Bersih Toko**.
* **Grafik Penjualan Harian**: Melihat tren omset hari demi hari.
* **Top 5 Produk Terlaris**: Mengetahui produk percetakan apa yang paling banyak diminati pelanggan.
* **Export Excel / CSV**: Ekspor seluruh laporan penjualan, piutang, dan stok ke file Excel/CSV dengan 1 klik.

---

### 9. 👤 Kelola Akun Kasir (Khusus Pemilik / Super Admin)
* Tambah akun kasir baru untuk staf toko.
* Reset kata sandi jika staf kasir lupa password.
* Nonaktifkan akun kasir yang sudah tidak bekerja.

---

## 🔑 Akun Pengguna Bawaan (Default Login)

Aplikasi sudah dilengkapi dengan akun contoh siap pakai untuk uji coba:

| Posisi / Hak Akses | Nama Lengkap | Username | Password |
|---|---|---|---|
| 👑 **Pemilik Toko (Super Admin)** | Owner Percetakan Perdana | `superadmin` | `superadmin123` |
| 🧑‍💼 **Kasir Shift 1** | Budi Kasir Pagi | `kasir_budi` | `password123` |
| 👩‍💼 **Kasir Shift 2** | Siti Kasir Siang | `kasir_siti` | `password123` |
| 👨‍🔧 **Operator Cetak** | Rian Operator Malam | `kasir_rian` | `password123` |

> 💡 **Catatan Hak Akses:**
> - **Akun Kasir**: Hanya dapat membuka menu Kasir POS, Antrian Pesanan, Riwayat Transaksi, dan Pelanggan.
> - **Akun Pemilik Toko (Owner)**: Memiliki akses penuh ke seluruh menu termasuk Dashboard, Laporan Keuangan, Pengeluaran, Master Produk, Stok Bahan, dan Manajemen Kasir.

---

## 🏛️ Arsitektur Sistem (Ringkas)

Aplikasi dibangun dengan 3 bagian utama yang bekerja bersamaan secara aman dan cepat:

```
[ Tampilan Layar Kasir (Frontend) ] ── (Kirim Permintaan) ──> [ Mesin Pengolah Data (Backend) ]
    Next.js / Layar Interaktif                                   Rust Actix-Web (Sangat Cepat)
                                                                            │
                                                                   (Simpan & Ambil Data)
                                                                            ▼
                                                                [ Database Toko (MySQL) ]
```

1. **Frontend (Layar Kasir)**: Dibuat menggunakan *Next.js (React)* dengan tampilan ramah pengguna, tombol besar, dan desain modern anti-pusing.
2. **Backend (Mesin Utama)**: Dibuat menggunakan bahasa *Rust (Actix-Web)* yang terkenal sangat cepat, hemat memori, dan bebas dari error crash.
3. **Database (Penyimpanan Data)**: Menggunakan *MySQL / MariaDB* untuk menyimpan data produk, stok bahan, nota transaksi, dan pelanggan dengan aman.

---

## 🚀 Cara Menjalankan Aplikasi di Komputer

### 1. Jalankan Backend (Mesin Data)
Buka terminal dan jalankan:
```bash
cargo run --bin backend
```
Backend akan aktif di alamat: `http://127.0.0.1:8800`

### 2. Jalankan Frontend (Layar Kasir)
Buka terminal baru di folder `apps/frontend` dan jalankan:
```bash
cd apps/frontend
npm run dev
```

### 3. Buka di Browser
Akses melalui Google Chrome atau browser favorit Anda:
* **Halaman Kasir POS**: [http://localhost:3000/pos](http://localhost:3000/pos)
* **Halaman Login**: [http://localhost:3000/login](http://localhost:3000/login)
* **Dashboard Pemilik**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
* **Showcase Publik**: [http://localhost:3000/](http://localhost:3000/)

---

## 📄 Lisensi
Sistem Kasir & Operasional Percetakan — Dilisensikan untuk kemudahan usaha percetakan digital dan offset.
