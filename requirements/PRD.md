# Product Requirement Document (PRD) - POS & Inventory Percetakan Perdana
_Revisi 2 - disesuaikan dengan data stok & daftar harga aktual toko_

## 1. Ringkasan Sistem
Sistem POS (Point of Sale) dan Manajemen Stok khusus bisnis percetakan. Menangani empat fungsionalitas utama:
1. Pengelolaan stok bahan mentah (kertas, tinta, lem, plastik, dll — termasuk varian warna/ukuran).
2. Transaksi kasir dengan skema harga fleksibel (Fixed, Range, Custom, serta Add-on — termasuk add-on harga rentang).
3. **Manajemen status produksi/pengerjaan**, karena sebagian besar item (spanduk, undangan, buku yasin, raport, dll) tidak selesai saat itu juga dan butuh dikerjakan dulu.
4. Data pelanggan sederhana untuk keperluan pengambilan barang & riwayat pesanan berulang.

## 2. Peran & Hak Akses (Role Matrix)

| Fitur / Modul | Super Admin | Admin (Kasir) |
| :--- | :---: | :---: |
| Manajemen Akun & Hak Akses | Full Access | No Access |
| Master Produk, Varian & Harga (Fixed/Range/Custom) | Full Access | Read Only |
| Master Add-on (Finishing/Pita/Cutting/dll, termasuk harga rentang) | Full Access | Read Only |
| Transaksi POS & Cetak Nota | Full Access | Full Access |
| Update Status Produksi (Antrian/Proses/Selesai/Diambil) | Full Access | Full Access |
| Data Pelanggan | Full Access | Full Access (tambah/lihat) |
| Mutasi Stok Bahan Mentah (IN/OUT) | Full Access | Full Access |
| Edit / Hapus Transaksi Terbuat | Full Access | No Access |
| Laporan Omset & Keuangan | Full Access | Read Only (Hari Ini) |
| Laporan Piutang (DP Outstanding) | Full Access | Read Only |

## 3. Spesifikasi Fitur Utama

### A. Modul Inventory (Bahan Baku Mentah)
* **Master Bahan**: Kategori, Nama, Varian/Warna/Ukuran (mis. Plastik Undangan ukuran 11–16, Tinta Cyan/Magenta/Yellow/Black, Kertas NCR Putih/Merah/Kuning/Biru/Hijau), Satuan (pcs, rim, roll, botol, meter), Sisa Stok.
* **Mutasi Stok**: Recording transaksi bahan masuk (`IN` - Pembelian) dan keluar (`OUT` - Produksi/Rusak).
* **Low Stock Warning**: Peringatan visual per varian bahan jika sisa stok berada di bawah ambang batas minimum.

### B. Modul POS (Kasir Jasa Cetak)
* **Katalog Produk**: Support `FIXED` (harga tetap, mis. Amplop Polos 20k), `RANGE` (harga rentang min-max, mis. Sticker Meter 10k-15k), dan `CUSTOM` (harga bebas sesuai kesepakatan, mis. Box Makanan, Kalender).
* **Varian Produk**: Satu produk bisa memiliki beberapa varian dengan harga berbeda tanpa duplikasi entri produk — contoh: Buku Yasin dibedakan berdasarkan jumlah halaman (128/176/208/210/224) dan jenis cover (Soft/Hard) dan jenis kertas (HVS/AP), masing-masing kombinasi punya harga sendiri.
* **Add-on System**: Opsi biaya tambahan per item, mendukung harga **tetap** (mis. Tambah Pita Rp1.000, Tambah Sudut Rp2.000) maupun harga **rentang** (mis. Cutting +5k-15k, Tambah Warna Stempel +5k).
* **Min. Order Validation**: Peringatan jika kuantitas pesanan di bawah batas minimum order produk (mis. ID Card + Lanyard min. 20pcs, Piagam/Medali min. 20pcs).
* **Status Pembayaran**: Support `PAID` (Lunas), `DP` (Uang Muka), dan `UNPAID`.
* **Diskon Transaksi**: Admin/Super Admin dapat memberi diskon nominal atau persentase per transaksi.

### C. Modul Status Produksi (Job Tracking) — *Baru*
Sebagian besar produk percetakan (spanduk, banner, undangan, buku yasin, raport, kalender, dll) tidak bisa langsung diserahkan saat transaksi dibuat. Modul ini melacak progres pengerjaan tiap transaksi:
* **Status Order**: `ANTRIAN` → `PROSES` → `SELESAI` → `DIAMBIL`.
* **Estimasi Selesai**: Tanggal perkiraan barang jadi, ditampilkan di nota & bisa difilter di daftar transaksi ("job jatuh tempo hari ini/besok").
* **Notifikasi visual**: Daftar transaksi yang statusnya masih `PROSES`/`ANTRIAN` namun sudah lewat estimasi tanggal selesai akan ditandai (highlight) di dashboard kasir.

### D. Modul Data Pelanggan — *Baru*
* **Master Pelanggan sederhana**: Nama, No. HP, Alamat (opsional).
* Transaksi bisa dikaitkan ke pelanggan terdaftar atau tetap "Umum" untuk pembeli tanpa data.
* Riwayat transaksi per pelanggan (berguna untuk pelanggan repeat seperti sekolah yang order raport/ijazah rutin).

### E. Modul Laporan
* **Laporan Omset & Keuangan** (harian/mingguan/bulanan).
* **Laporan Piutang (DP Outstanding)** — *baru*: daftar transaksi berstatus `DP` beserta sisa tagihan, agar Super Admin bisa menagih.
* **Laporan Produk Terlaris** — *baru*: ranking produk berdasarkan qty/omset, membantu keputusan stok bahan baku.
* **Laporan Stok Rendah**: daftar bahan baku di bawah ambang minimum.
