# DOKUMEN IMPLEMENTASI — Input Bahan Manual (Tanpa BOM) & Penyelarasan Satuan Stok

**Status:** Menunggu persetujuan owner sebelum implementasi kode
**Tanggal:** 2026-08-30
**Cakupan:** `apps/backend`, `packages/entity`, `apps/frontend`, migration SQL
**Referensi:** `PRD.md`, `API.md`, `DATABASE.md`, `requirements/AGENTS.md`, lampiran `daftar_stok_dan_harga_percetakan_perdana` (MD/PDF)

---

## 1. Latar Belakang

Percetakan Perdana sebelumnya mencatat stok secara manual di buku (kolom Stok / Pembelian / Pengeluaran / Sisa). Sistem saat ini menghitung kebutuhan bahan pesanan secara otomatis dari **BOM (bill-of-materials)** — namun rumus BOM tersebut hanyalah estimasi AI, **bukan rumus pasti dari owner**. Di lapangan:

1. Tidak ada rumus bahan yang pasti per produk; operatorlah yang mengestimasi kebutuhan tiap pesanan (seperti kebiasaan di buku).
2. Input operator berbentuk satuan pakai: **per lembar** (kertas), **per meter** (umbul-umbul/spanduk), **per pcs** (amplop, plastik undangan), dst.
3. Stok dibeli/dicatat dalam kemasan: **rim, rol, box/dus, botol** — sehingga perlu jembatan konversi kemasan → satuan dasar.

Keputusan owner: **hapus ketergantungan pada BOM di alur pesanan; kebutuhan bahan diinput manual oleh operator saat membuat pesanan.** Dokumen ini merinci perubahan yang akan diterapkan.

## 2. Tujuan & Non-Tujuan

**Tujuan**
- Operator mengisi bahan + qty yang dipakai per baris pesanan (estimasi sendiri, total per pekerjaan).
- Stok tetap terjaga: tidak boleh minus, semua pergerakan tercatat di ledger immutable.
- Satuan stok selaras dengan cara operator berpikir (satuan dasar), dengan konversi kemasan untuk penerimaan barang.
- Riwayat pesanan membekukan bahan yang dipakai (audit), menggantikan fungsi buku.

**Non-Tujuan (fase ini)**
- Tidak ada kalkulasi BOM otomatis di checkout (BOM dinonaktifkan dari alur pesanan).
- Tidak ada fitur "bahan bawaan/template per produk" (opsional fase 2).
- Tidak mengubah alur pembayaran, status produksi, waste/rework, pembatalan, dan ledger.

## 3. Ringkasan Keputusan Desain

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Kebutuhan bahan **hanya** dari input `materials[]` di checkout. Cabang BOM dan legacy-link di `resolve_product_materials` dihapus dari alur pesanan. | Owner: tidak ada rumus pasti; BOM hanya estimasi AI. |
| D2 | Produk punya flag `uses_material` (boolean). Jika `true`, checkout **wajib** mengisi minimal 1 bahan untuk item tersebut; jika `false`, bahan opsional (produk jasa/barang jadi). | Mencegah stok lupa dipotong, tanpa memaksa konfigurasi rumus. |
| D3 | Qty bahan = **total per baris item** (level pekerjaan), bukan per pcs. Contoh: 4 umbul-umbul → input total `17 meter`. | Sesuai cara operator mengestimasi di buku. |
| D4 | Setiap bahan punya **satuan dasar** (`unit`): satuan yang dipakai operator saat mengonsumsi (lembar, meter, pcs, ml/botol). Stok & reservasi & input semua dalam satuan dasar. | Menghilangkan hitung pecahan rim/rol di kepala operator. |
| D5 | Kolom baru opsional `package_unit` + `package_size` di bahan: untuk mempercepat penerimaan barang (input `2 rim` → `1000 lembar`) dan display ganda. Konversi dilakukan di **UI frontend saja**; backend mutasi tetap menerima qty satuan dasar. | Perubahan backend minimal; data tetap satu kebenaran. |
| D6 | Input manual TIDAK pernah dipercaya soal ketersediaan: validasi stok (`stock - reserved_stock >= qty`) tetap di server saat reservasi. | Menjaga invariant stok tidak minus. |
| D7 | Snapshot `transaction_item_materials` tetap menjadi sumber kebenaran per order dengan `source_type = "MANUAL_POS"`, `consumption_basis = "MANUAL"`. | Riwayat & laporan bisa membedakan input manual vs historis BOM. |
| D8 | Field legacy `raw_material_id`/`material_qty` (single) di payload item **ditolak eksplisit** oleh server (bukan diabaikan diam-diam). | Mencegah klien lama mengirim data yang tidak dipakai. |
| D9 | Tabel & endpoint BOM **tidak dihapus** dari database (dipakai riwayat order lama & audit), hanya tidak lagi dipanggil dari checkout. UI manajemen BOM disembunyikan/ditandai nonaktif. | Menjaga integritas data historis; rollback aman. |
| D10 | `length`/`width` di item tetap ada sebagai **catatan produksi** (mis. ukuran umbul-umbul 0,9×4 m) dan tidak menghitung apa pun di mode manual. Kalkulator banner tetap sebagai alat bantu hitung operator. | Informasi produksi berguna tanpa memaksa rumus. |

## 4. Master Data: Satuan Dasar & Konversi (berdasar daftar stok riil)

### 4.1 Bahan baku — rekomendasi satuan

Aturan: `unit` = satuan dasar (cara operator menulis pengeluaran di buku); `package_unit`/`package_size` = kemasan beli. **Angka package_size bertanda `?` wajib dikonfirmasi owner sebelum migrasi data.**

| Bahan (sesuai daftar) | `unit` (dasar) | `package_unit` | `package_size` |
|---|---|---|---|
| KERTAS BW 23 / BW 21 / KUNSRUK / STIKER CROMO / BC TIK | lembar | rim | 500 |
| CIWI PUTIH / MERAH-PINK / HIJAU / KUNING / BIRU | lembar | rim | 500 |
| HVS F4 PUTIH / KUNING / HIJAU / BIRU | lembar | rim | 500 |
| NCR PUTIH / MERAH / KUNING (+ BIRU, HIJAU dari catatan tangan) | lembar | rim | 500 |
| AMPLOP SEDANG / PANJANG | pcs | box | 500 *(estimasi, bisa diganti)* |
| PLASTIK UND. UKURAN 8 – 18 | pcs | dus | 100 *(estimasi, bisa diganti)* |
| TINTA CETAK CYAN / MAGENTA / YELLOW / BLACK (+ MERAH) | ml | botol | 1000 *(keputusan owner: ml)* |
| BAHAN KARET STEMPEL | pcs | pcs | 1 |
| LEM FOX | botol | botol | 1 |
| FLEXI / KAIN SPANDUK / KAIN UMBUL-UMBUL *(bahan meteran, diputuskan distokkan)* | meter | rol | 50 *(estimasi, bisa diganti)* |

Catatan:
- Tinta diputuskan owner dalam **ml** (`unit=ml`, `package_unit=botol`, `package_size=1000`).
- Bahan meteran (flexi/kain) diputuskan **distokkan** dengan `unit=meter`; produk spanduk/umbul-umbul/spanduk kain menjadi `uses_material=true`.
- Nilai bertanda *estimasi* hanyalah titik awal; owner dapat mengubah `package_unit/package_size` kapan pun lewat form bahan di halaman Inventaris (tidak memengaruhi stok yang sudah tercatat, hanya konversi tampilan/penerimaan).

### 4.2 Produk — rekomendasi flag `uses_material`

| Kelompok produk | `uses_material` | Bahan yang biasanya dipakai (input manual) |
|---|---|---|
| Nota/Faktur (HVS/NCR 1–3 ply), Brosur, Kop Surat, Sertifikat | `true` | kertas HVS/NCR/art paper + tinta |
| Undangan (fisik), Undangan Blangko | `true` | kertas + plastik undangan |
| Amplop Polos / Custom | `true` | stok amplop |
| Sticker (A3+) | `true` | kertas stiker cromo |
| Stempel Flash / Kayu | `true` | karet stempel |
| Spanduk, Spanduk Kain, Bendera/Umbul-umbul, Sticker (meter) | `true` **jika** bahan flexi/kain distokkan; jika tidak, `false` | flexi/kain (meter) + tinta |
| Box Makanan, Raport, Map/Sampul, Paper Bag, Buku Yasin, Qur'an, Piagam/Medali, ID Card, Name Tag, Gantungan Kunci, X Banner, Roll Banner, Stand | `false` (barang jadi/beli putus) — owner boleh mengubah | — |
| Undangan Digital, jasa desain | `false` | — |

Daftar ini **rekomendasi awal**; keputusan final di tangan owner saat penyiapan master data (lihat §10).

## 5. Perubahan Data Model & Migration

File migration baru: `requirements/migrations/0002_manual_materials.sql` (dicatat di repo sesuai konvensi AGENTS.md). Setelah DDL, regenerate entity: `sea-orm-cli generate entity -u "mysql://..." -o packages/entity/src`.

```sql
-- 0002_manual_materials.sql
-- 1) Kemasan beli untuk kenyamanan penerimaan & display (opsional per bahan)
ALTER TABLE raw_materials
  ADD COLUMN package_unit VARCHAR(50) NULL AFTER unit,
  ADD COLUMN package_size DECIMAL(12,4) NULL AFTER package_unit;

-- 2) Flag produk yang wajib diisi bahan saat checkout
ALTER TABLE products
  ADD COLUMN uses_material BOOLEAN NOT NULL DEFAULT FALSE AFTER has_variants;
```

**Migrasi data (sekali jalan, SETELAH opname & konfirmasi owner).** Template per kelompok bahan — stok, reserved_stock, dan min_stock_warning dikalikan faktor konversi karena `unit` berubah menjadi satuan dasar:

```sql
-- Contoh: semua kertas → lembar (1 rim = 500 lembar)
UPDATE raw_materials
SET unit = 'lembar', package_unit = 'rim', package_size = 500,
    stock = stock * 500,
    reserved_stock = reserved_stock * 500,
    min_stock_warning = min_stock_warning * 500
WHERE id IN (/* id bahan kertas hasil opname */);
```

Bahan dengan `unit` yang sudah sama dengan satuan dasar (tinta botol, karet pcs) hanya diisi `package_unit/package_size` bila perlu; nilai stok tidak berubah.

**Perubahan entity (`packages/entity`)**
- `raw_materials.rs`: tambah `package_unit: Option<String>`, `package_size: Option<Decimal>`.
- `products.rs`: tambah `uses_material: bool`.

## 6. Perubahan Backend

### 6.1 `services/transactions.rs` — inti perubahan

Ganti isi `resolve_product_materials` (saat ini baris 374–450) menjadi logika manual-only:

```rust
async fn resolve_product_materials(
    txn: &DatabaseTransaction,
    product: &entity::products::Model,
    _variant: Option<&entity::product_variants::Model>,
    item: &TransactionItemInput,
) -> Result<Vec<ProcessedMaterial>, AppError> {
    // Field legacy single-material tidak lagi didukung
    if item.raw_material_id.is_some() || item.material_qty.is_some() {
        return Err(AppError::field(
            "materials",
            "Field bahan legacy tidak didukung. Gunakan array materials[].",
        ));
    }

    let inputs = item.materials.clone().unwrap_or_default();
    if inputs.is_empty() {
        if product.uses_material {
            return Err(AppError::field(
                "materials",
                &format!("Produk \"{}\" memakai bahan. Isi bahan yang digunakan untuk produksi.", product.name),
            ));
        }
        return Ok(Vec::new()); // produk jasa / barang jadi
    }

    // Validasi: qty > 0 dan tidak ada bahan duplikat dalam satu item
    let mut seen = std::collections::HashSet::new();
    let mut result = Vec::with_capacity(inputs.len());
    for input in inputs {
        if input.material_qty.unwrap_or_default() <= Decimal::ZERO {
            return Err(AppError::field("materials.material_qty", "Kuantitas bahan harus lebih dari 0"));
        }
        if !seen.insert(input.raw_material_id) {
            return Err(AppError::field("materials", "Bahan duplikat dalam satu item; gabungkan jumlahnya"));
        }
        result.push(ProcessedMaterial {
            raw_material_id: input.raw_material_id,
            required_qty: input.material_qty.unwrap(),
            source_type: "MANUAL_POS".into(),
            consumption_basis: "MANUAL".into(),
            required_width_m: None,   // input manual = reservasi agregat, tanpa pemilihan lot
            allow_offcut: false,
            bom_id: None, bom_line_id: None, bom_version: None, addon_id: None,
        });
    }
    Ok(result)
}
```

Konsekuensi yang sudah aman tanpa perubahan hilir:
- `required_width_m = None` → `choose_and_reserve_lot` otomatis dilewati (reservasi agregat), sama seperti perilaku bahan non-lot saat ini.
- `reserve / consume_reservation / release_reservation / waste / rework / ledger` **tidak diubah**.
- Panggilan `bom::active_product_bom` dan path legacy-link dihapus dari fungsi ini. Import `bom` di `transactions.rs` boleh dibersihkan bila tidak dipakai lagi.

### 6.2 DTO & route produk

- `dto/products.rs`: tambah `uses_material: Option<bool>` di `CreateProductRequest`/`UpdateProductRequest` dan `uses_material: bool` di `ProductResponse`.
- `services/products.rs`: map field baru di create/update/response.
- Role: create/update produk sudah SUPER_ADMIN sesuai Role Matrix — tidak ada perubahan otorisasi.

### 6.3 DTO & service bahan baku

- `dto/raw_materials.rs`: tambah `package_unit: Option<String>`, `package_size: Option<Decimal>` di create/update/response.
- `services/raw_materials.rs`: map field baru. **Logika `create_mutation_as` tidak berubah** — qty mutasi selalu dalam satuan dasar.
- Validasi tambahan saat update satuan: bila `reserved_stock > 0`, perubahan `unit`/konversi dilarang (mencegah inkonsistensi reservasi berjalan); admin harus menunggu order selesai atau membatalkan dulu.

### 6.4 Laporan

- `services/reports.rs`: pemakaian bahan sudah terbaca dari `transaction_item_materials`; tambahkan filter/penanda `source_type` bila laporan pemakaian dirinci, agar input manual terpisah dari riwayat BOM lama.

### 6.5 BOM

- `routes/bom.rs` + `services/bom.rs` + tabel BOM: dipertahankan **hanya untuk data historis/audit**, tidak dipanggil dari checkout.
- Frontend: UI manajemen BOM **dihapus** (`BomEditorModal.tsx` dihapus, method `getProductBom/saveProductBom/getAddonBom/saveAddonBom` dihapus dari `productService.ts`, tombol BOM di list produk/add-on dihapus) agar owner tidak mengkonfigurasi rumus yang tidak lagi berpengaruh.

## 7. Perubahan Frontend

### 7.1 Tipe

- `types/product.ts`: `Product.uses_material: boolean`.
- `types/rawMaterial.ts`: `package_unit?: string | null`, `package_size?: number | null`.
- `components/pos/types.ts`: `CartItem.materials: CartItemMaterial[]` dengan `{ raw_material_id, material_qty }`.

### 7.2 POS — panel bahan per item

`components/pos/CartItemCard.tsx`: tambah seksi **"Bahan dipakai"** di tiap kartu item:

```
┌ Cetak Nota NCR 2 Ply ─ qty: 1 rim ─ harga: 320.000 ┐
│  Bahan dipakai (WAJIB)                             │
│  [ KERTAS NCR PUTIH      ] [ 500 ] lembar  sisa 1.200 │
│  [ TINTA CETAK BLACK     ] [ 0.2 ] botol   sisa 3     │
│  [+ Tambah bahan]                                  │
└────────────────────────────────────────────────────┘
```

- Dropdown bahan: hanya bahan `is_active`, bisa dicari, menampilkan satuan + stok tersedia (`stock - reserved_stock`) sebagai panduan.
- Input qty desimal (step 0.5 / bebas ketik).
- Panel tampil untuk semua produk; badge **WAJIB** bila `product.uses_material`.
- `length/width` tetap sebagai catatan ukuran (tidak menghitung).

### 7.3 Checkout

- `hooks/usePOSState.ts`:
  - Sertakan `materials` di payload item (struktur DTO sudah mendukung).
  - Validasi client sebelum submit: item dengan `uses_material` tanpa bahan → blokir dengan pesan nama produk.
  - Pesan error server (409 stok kurang) sudah ditampilkan lewat alur error yang ada.
- `BannerCalculatorModal` tetap sebagai alat bantu; hasilnya tetap diketik/diisi operator ke baris bahan (tidak auto-fill).

### 7.4 Halaman admin

- `app/products/page.tsx`: toggle **"Memakai bahan stok"** (`uses_material`) di form produk.
- `app/inventory/page.tsx`:
  - Form bahan: field `unit` (satuan dasar), `package_unit`, `package_size`.
  - Form penerimaan barang: input qty dalam satuan dasar **atau** mode kemasan (`2 rim` → otomatis `1000 lembar` memakai `package_size`) — konversi di sisi UI, payload mutasi tetap satuan dasar.
  - Display stok ganda bila `package_size` ada: `4.200 lembar (8 rim 200 lembar)`.

## 8. Alur End-to-End Setelah Perubahan

```
Operator estimasi bahan (kebiasaan buku)
        │
POS: item + panel "Bahan dipakai" (qty total per pekerjaan, satuan dasar)
        │  payload items[].materials[]
Backend create():
  1. validasi payload & idempotency (tidak berubah)
  2. resolve_product_materials = MANUAL-ONLY (baru)
     - uses_material & kosong → 422
     - qty<=0 / duplikat / bahan nonaktif → 422/409
  3. snapshot transaction_item_materials (source_type MANUAL_POS)
  4. bila ada pembayaran → reserve (validasi stok, ledger RESERVE)   [tidak berubah]
  5. PROSES → consume (ledger CONSUME)                              [tidak berubah]
  6. Batal → release reservasi; waste/rework seperti sekarang       [tidak berubah]
```

### Contoh payload (produk riil)

Nota NCR 2 ply 1 rim + tinta:

```json
{ "items": [{ "product_id": 21, "qty": 1, "custom_price": 320000,
  "materials": [
    { "raw_material_id": 15, "material_qty": 500 },
    { "raw_material_id": 34, "material_qty": 0.2 }
  ] }] }
```

Umbul-umbul 4 pcs @4 m (bahan distokkan meter):

```json
{ "items": [{ "product_id": 40, "qty": 4, "length": 4, "width": 0.9,
  "materials": [
    { "raw_material_id": 51, "material_qty": 17 },
    { "raw_material_id": 31, "material_qty": 0.5 }
  ] }] }
```

Amplop custom 100 pcs (memakai stok amplop jadi):

```json
{ "items": [{ "product_id": 33, "qty": 100,
  "materials": [{ "raw_material_id": 18, "material_qty": 100 }] }] }
```

## 9. Dampak

**Berubah:** sumber `required_qty` (BOM → input manual), skema (`uses_material`, `package_unit`, `package_size`), UI POS (panel bahan), UI produk & inventori, pesan error checkout, test yang menguji path BOM di checkout.

**Tidak berubah:** pembayaran/DP, state machine order (ANTRIAN→PROSES→SELESAI→DIAMBIL/BATAL), reservasi/konsumsi/release, pemilihan lot & offcut (tetap tersedia untuk bahan ber-`required_width_m` di masa depan), waste/rework, ledger & audit, idempotency, tracking publik, cetak nota.

## 10. Rencana Rollout

1. **Kode & migration DDL** masuk staging; test backend diperbarui (§11).
2. **Opname stok fisik** oleh owner (kolom Stok di buku diisi).
3. **Penyiapan master data** (SUPER_ADMIN): satuan dasar + package per bahan (§4.1), flag `uses_material` per produk (§4.2), konfirmasi nilai bertanda `?`.
4. **Migrasi data** SQL (§5) dijalankan sekali setelah opname.
5. **Parallel run 1 minggu**: buku tetap diisi, sistem dipakai bersamaan; selisih stok dicek harian.
6. **Cut-over**: buku pensiun.

## 11. Rencana Test

Backend (`cargo test`, DB testing terpisah/rollback sesuai AGENTS.md):
- Checkout dengan `materials[]` + pembayaran → reservasi terbentuk, ledger RESERVE, snapshot `MANUAL_POS`.
- Produk `uses_material=true` tanpa bahan → 422 dengan pesan nama produk.
- Qty bahan ≤ 0 → 422; bahan duplikat per item → 422; bahan nonaktif → 409.
- Stok kurang → 409 dengan rincian tersedia vs butuh; stok tidak pernah minus.
- Field legacy `raw_material_id`/`material_qty` → 422.
- PROSES → CONSUME mengurangi `stock` & `reserved_stock`; BATAL → release; waste/rework tetap berfungsi.
- Test lama yang menguji kalkulasi BOM di checkout disesuaikan/dihapus (perilaku diganti manual).

Frontend (manual checklist): panel bahan muncul & wajib untuk produk flag; blokir checkout; display stok ganda; penerimaan mode kemasan; struk tetap dari server.

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Operator lupa/keliru estimasi → stok drift | Flag `uses_material` memaksa input; laporan pemakaian per `source_type`; opname berkala; waste/rework untuk koreksi |
| Salah konversi saat migrasi data | Migrasi data hanya setelah opname + konfirmasi owner; file migration tercatat di repo |
| Klien lama mengirim field legacy | Ditolak eksplisit (D8), bukan diabaikan |
| Perubahan satuan saat reservasi berjalan | Update satuan dilarang bila `reserved_stock > 0` (§6.3) |
| HPP kurang akurat tanpa BOM | Di luar tujuan fase ini; laporan pemakaian manual menjadi sumber data biaya |

## 13. Keputusan Final Owner (menutup pertanyaan terbuka)

1. **Box amplop / dus plastik**: pakai estimasi dulu (box amplop = 500 pcs, dus plastik = 100 pcs); dapat diganti kapan pun lewat UI admin bahan.
2. **Tinta**: dalam **ml** (`unit=ml`, `package_unit=botol`, `package_size=1000`).
3. **Bahan meteran** (flexi/kain spanduk/kain umbul-umbul): **distokkan** dengan `unit=meter` (`package_unit=rol`, `package_size=50` estimasi); produk spanduk/spanduk kain/umbul-umbul/sticker meter menjadi `uses_material=true`.
4. **Daftar `uses_material`**: gunakan rekomendasi §4.2 sebagai titik awal; owner menyesuaikan lewat toggle di form produk.

## 14. Status Implementasi

**Status: SELESAI (kode)** — 2026-08-30.

- Backend: entity + migration `0002_manual_materials.sql` + auto-migrasi `config.rs`; `resolve_product_materials` manual-only; validasi (wajib bahan bila `uses_material`, qty>0, duplikat, field legacy ditolak); guard ganti satuan saat `reserved_stock>0`; test integrasi baru `test_manual_materials_checkout_lifecycle`.
- Frontend: panel "Bahan Dipakai" di kartu item POS + validasi checkout; toggle "Memakai Bahan Stok" di form produk; form bahan (satuan dasar + kemasan); restock mode kemasan memakai master `package_size` (fallback heuristik lama); display stok ganda di tabel inventori; UI BOM dihapus.
- Verifikasi: `cargo check` & `cargo test -- --test-threads=1` hijau (12 test integrasi + 6 unit); `tsc --noEmit` bersih; `next build` sukses.
- Catatan: bila test dijalankan paralel, `test_pos_transaction_complete_lifecycle` dapat deadlock pada baris tanggal `invoice_counter` — artefak konkurensi yang sudah ada sebelumnya (dua test checkout bersamaan), bukan regressi perubahan ini.
- Langkah berikutnya (operasional): jalankan migration data §5 blok 3 setelah opname, set `uses_material` per produk, dan isi stok awal bahan meteran.
