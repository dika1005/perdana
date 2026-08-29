# Ringkasan Perubahan & Panduan Persiapan Aplikasi Kasir Percetakan "Perdana"

> Dokumen ini berisi rangkuman semua perbaikan yang sudah diimplementasikan pada
> proyek (Rust/Actix backend + Next.js/TypeScript frontend), hasil audit menyeluruh
> agar aplikasi siap pakai di percetakan riil (2 role: SuperAdmin/Owner & Admin/Kasir).
>
> Tujuan: alur uang konsisten, stok aman dari negatif & over-sell, pembatalan aman,
> dan rumus bahan baku masuk akal & bisa dikontrol admin.

---

## 1. DAFTAR PERUBAHAN YANG SUDAH DIIMPLEMENTASIKAN

### A. Kritis (Bug Finansial / Logika)
| Kode | Masalah Sebelumnya | Perbaikan |
|------|-------------------|-----------|
| BUG A | Stok boleh negatif, disembunyikan `.max(0)` | Validasi stok sebelum potong; tolak transaksi + rollback bila kurang (pesan jelas ke kasir) |
| BUG B | "Laba Bersih" salah (omset kotor − biaya) | Pisah **Omset Pesanan** (total_amount) & **Kas Masuk** (pay_amount); Laba = Kas Masuk − Biaya |
| BUG C | Status lunas bisa dimanipulasi client | Status LUNAS selalu dihitung **server-side** dari (total vs dibayar) |
| Invoice | Nomor bisa bentrok (random timestamp) | Counter harian unik `INV-YYYYMMDD-<seq>` (tabel `invoice_counter`, dalam transaksi sama) |
| Struk | Fallback struk dari data client | Hapus fallback; selalu pakai data resmi dari server (`getInvoiceData`) |

### B. Rekomendasi B1–B8
| Kode | Perbaikan |
|------|-----------|
| B1 | **Race condition stok (over-sell)** → pemotongan stok pakai `lock_exclusive()` (SELECT … FOR UPDATE) per baris bahan |
| B2 | **Cancel presisi** → kolom `transaction_id` di `raw_material_mutations`; pengembalian stok cari via `transaction_id` (bukan cocok teks) |
| B3 | **Batas batal** → hanya boleh dibatalkan saat status Antrian/Proses; SELESAI/DIAMBIL ditolak |
| B4 | **Soft-guard customer** → tidak bisa hapus pelanggan yang masih punya riwayat transaksi (cegah putus piutang) |
| B5 | **Role** → tetap 2 role (SuperAdmin/Owner + Admin/Kasir); endpoint `/users` dilindungi SuperAdmin |
| B6 | **Laba Kas** → label "Laba Bersih (Kas)" dengan subtitle penjelas (bukan laba akuntansi/HPP) |
| B7 | **Stok desimal** → `raw_materials.stock/min_stock_warning` & `raw_material_mutations.qty` diubah ke `Decimal(12,4)`; pemotongan TIDAK dibulatkan ke atas (presisi meter/gram) |
| B8 | **Test compile** → test files diperbaiki (`..Default::default()`, Decimal) → `cargo test --no-run` hijau |

### C. Rumus BOM (Bahan Baku Terpakai) — "Sebaik Mungkin"
| Item | Perubahan |
|------|-----------|
| Input dimensi | Kasir mengisi **Panjang & Lebar (meter)** di keranjang POS → disimpan di `transaction_items` (kolom `length`/`width` baru + migrasi) |
| Rumus bahan | `material_qty = qty × LUAS(m², bila diisi) × material_amount` + kompatibel mundur (tanpa dimensi → per pcs) |
| Auto-BOM Dual-Mode | **Mode Eksplisit**: bila admin sudah set bahan utama + faktor di master produk → pakai itu (presisi, tidak tebak nama). **Mode Cadangan**: tebak-nama hanya bila belum di-set |
| Waste 5% | Setiap bahan potong +5% sisa potong |
| Tinta proporsional | 1 unit tinta per ~5 m² per warna (bukan flat 1) |
| Per-jenis realistis | Banner→flexi per m²; X-Banner/Roll→flexi per panjang + stand; Bendera→kain m²; Stiker vinyl→roll per meter; Amplop→1 lembar (bukan ×100); Nota/Kop→per rim |
| UI Master Produk | `ProductFormModal` & `VariantFormModal` punya input "Pemakaian Bahan per 1 m²" (material_amount) |

### D. File yang Diubah (Ringkas)
- **Backend**: `raw_materials.rs`, `transactions.rs`, `invoice_counter.rs` (baru), `reports.rs`, `customers.rs`, `config.rs` (migrasi + seed aman), `extractors.rs`, `routes/*`, `dto/*`, `bin/seed.rs`, `tests/*`, entity `raw_materials.rs`/`raw_material_mutations.rs`/`transaction_items.rs`
- **Frontend**: `usePOSState.ts`, `autoBomRules.ts`, `ProductFormModal.tsx`, `VariantFormModal.tsx`, `TransactionDetailDrawer.tsx`, `transactionService.ts`, `page.tsx` (transactions), `TransactionTable.tsx`, `types/*`, `DashboardStatCards.tsx`, `tracking/*`
- **Migration & Config**: `requirements/migrations/0001_perdana_changes.sql` (catatan resmi DDL), `.env.example` (sesuai guideline AGENTS.md)

### E. Kepatuhan Guidelines Proyek (`requirements/AGENTS.md`)
| Aturan AGENTS.md | Status |
|------------------|--------|
| Password hash bcrypt | ✅ Sudah (`utils::password`, verify_password/hash_password) |
| JWT claim user_id/role/exp + middleware validasi | ✅ Extractor `AuthUser`/`SuperAdminUser` (setara middleware) memvalidasi tiap route |
| Guard role sensitif hanya SUPER_ADMIN | ✅ Endpoint `/users` pakai extractor SuperAdmin |
| Format error standar (`success/message/errors`) | ✅ `AppError` konsisten di semua route |
| Migration file tercatat (bukan ALTER telanjang) | ✅ `requirements/migrations/0001_perdana_changes.sql` + auto-migrasi di `config.rs` sebagai safety net |
| `.env.example` (bukan `.env` asli) | ✅ Dibuat `.env.example` |
| Entity generate via sea-orm-cli bila ubah DDL | ⚠️ Entity diubah manual (sudah sinkron dgn skema); regen CLI disarankan bila ada drift |

---

## 2. HAL YANG PERLU ANDA LAKUKAN (WAJIB SEBELUM PRODUCTION)

### 2.1 Jalankan Migrasi DB (Otomatis saat start backend)
- Pastikan **MariaDB/MySQL hidup** dan `.env` `DATABASE_URL` benar.
- Jalankan `cargo run --bin backend` → saat startup otomatis:
  - Buat tabel `invoice_counter`
  - ALTER enum `order_status` tambah `'BATAL'`
  - Ubah `raw_materials.stock/min_stock_warning` ke `DECIMAL(12,4)`
  - Ubah `raw_material_mutations.qty` ke `DECIMAL(12,4)` + tambah kolom `transaction_id`
  - Tambah kolom `length`/`width` di `transaction_items`
- Jika DB sudah ada & ingin migrasi manual (tanpa jalankan app), siapkan file `migrations.sql` (lihat section 4).

### 2.2 Lengkapi Master Produk (Paling Penting untuk Akurasi BOM)
Agar rumus bahan presisi (tidak tebak-nama), admin WAJIB mengisi untuk setiap produk cetak:
1. Buka **Master Produk** → edit produk (mis. "Banner Spanduk").
2. Pilih **Bahan Baku Utama** = mis. `Flexi Banner`.
3. Isi **Pemakaian Bahan per 1 m²** = `1` (artinya 1 m² pesanan butuh 1 m² flexi).
4. Simpan.
→ Setelah itu semua transaksi produk tersebut menghitung bahan akurat.
> Produk yang BELUM di-set bahan utamanya tetap jalan via tebak-nama (cadangan),
> tapi disarankan dilengkapi agar tidak salah hitung.

### 2.3 Isi Stok Bahan Baku & Tinta
- Pastikan stok `Flexi Banner`, `Kain TC`, `Stiker`, `Kertas`, dan **TINTA (Cyan/Magenta/Yellow/Black)**
  sudah diinput dengan satuan benar (meter / lembar / botol).
- Karena tinta kini ikut ter-track stok (proporsional luas), admin harus rutin update stok tinta
  (mis. 1 botol = 1000 ml, isi stok sesuai). Bila stok tinta 0 → transaksi ditolak (aman, tapi
  kasir harus isi stok dulu). Saran: set stok tinta besar / non-tracking bila tidak ingin merepotkan.

### 2.4 Uji Cetak Struk & Pembatalan
- Di mesin percetakan: buat 1 transaksi banner → cek stok flexi & tinta terpotong.
- Buka riwayat → detail → **Batalkan Transaksi** → cek stok kembali.
- Pastikan tombol batal tampil (jika tidak, **restart `npm run dev`** karena bundle lama).

### 2.5 Keamanan Akun
- Ganti `SEED_SUPERADMIN_PASSWORD` di `.env` dari default sebelum go-live.
- SuperAdmin hanya 1 (owner); Admin/Kasir tidak bisa kelola user.

---

## 3. REKOMENDASI LANJUTAN (OPSIONAL, TAPI PENTING UNTUK RIIL)

| Prioritas | Rekomendasi | Alasan |
|----------|-------------|--------|
| Tinggi | **Tabel Recipe/BOM tersendiri** (produk ↔ banyak bahan dgn faktor) | 1 produk bisa punya resep multi-bahan presisi tanpa tebak-nama; lebih awet dari field tunggal `raw_material_id` |
| Tinggi | **Laporan HPP & Laba Riil** | Laba saat ini = Kas − Biaya (belum potong HPP bahan). Tambah kolom harga beli bahan → laba akuntansi sebenarnya |
| Sedang | **Peringatan stok tinta habis saat checkout** | Kasir tahu sebelum transaksi ditolak |
| Sedang | **Soft-delete untuk produk/customer** (is_active) | Hapus hard-delete berisiko hilang riwayat; soft-delete lebih aman |
| Sedang | **File `migrations.sql` terpisah** | ✅ SUDAH dibuat: `requirements/migrations/0001_perdana_changes.sql` (catatan resmi DDL + rollback) |
| Sedang | **Regen entity via sea-orm-cli** | Sesuai AGENTS.md, jalankan `sea-orm-cli generate entity ...` bila ada drift skema vs entity (sudah sinkron saat ini) |
| Rendah | **Unit test otomatis `cargo test` berjalan di CI** | Butuh DB live; pasang di server CI untuk quality gate |
| Rendah | **Role Kasir sungguhan (batasi lihat laporan)** | Jika owner mau kasir tidak lihat laba, perlu role ke-3 + guard route |

---

## 4. CATATAN TEKNIS & STATUS

- **Backend**: `cargo build` ✅ | `cargo test --no-run` ✅
- **Frontend**: `npx tsc --noEmit` ✅ | `npx next build` ✅ (16 halaman)
- **Smoke-test DB**: BELUM dijalankan di environment development (MariaDB tidak hidup di sini).
  → Logika runtime (invoice unik, lock stok, cancel, BOM) perlu Anda coba di mesin percetakan.
- **Seed**: `seed_super_admin` aman (idempoten, tidak hapus data). `bin/seed.rs` menanam data contoh.

---

## 5. CONTOH ALUR RIIL (Sudah Didukung)

1. Admin: Master Produk → edit "Banner Spanduk" → Bahan Utama = Flexi Banner, Pemakaian = 1 → Simpan.
2. Kasir: POS → "Banner Spanduk" → isi Panjang 3m × Lebar 1m, qty 2.
3. Sistem: flexi = 2 × (3×1) × 1 × 1.05 ≈ 7 m²; tinta cyan/magenta = 2 unit masing-masing.
   Stok flexi & tinta langsung terpotong (terkunci via row-lock, aman dari over-sell).
4. Batal: riwayat → detail → "Batalkan Transaksi" → stok flexi & tinta kembali otomatis (presisi).

---

*Dokumen ini dibuat untuk dikoreksi oleh owner. Silakan tambahkan catatan di bagian
"Rekomendasi Lanjutan" bila ada kebutuhan bisnis spesifik (mis. jenis bahan lain,
aturan diskon khusus, dll).*
