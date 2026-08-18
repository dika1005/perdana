# Guidelines for AI Coding Agents

## Project Workspace Guidelines
1. **Monorepo Boundaries**:
   * Jangan campur kode Rust di `apps/backend` dengan TypeScript di `apps/frontend`.
   * Entitas SeaORM berada eksklusif di `packages/entity`.

2. **Backend Development Rules (Actix Web & SeaORM)**:
   * Pisahkan layer Controller (`apps/backend/src/routes/`), Business Logic (`apps/backend/src/services/`), dan Request/Response Body (`apps/backend/src/dto/`).
   * Gunakan DTO untuk parsing JSON, jangan mengembalikan struct Entitas SeaORM langsung ke HTTP Response.
   * Gunakan `dotenvy` untuk pengelolaan variabel lingkungan.

3. **Database Entity Generation**:
   * Jika ada perubahan skema DDL MySQL, jalankan CLI dari root workspace:
     `sea-orm-cli generate entity -u "mysql://USER:PASS@localhost:3306/perdana" -o packages/entity/src`

4. **Commands**:
   * Build & Run Backend: `cargo run --bin backend`
   * Check Cargo Errors: `cargo check`
   * Build & Run Frontend: `pnpm --prefix apps/frontend dev`

## Auth & Authorization (Baru)
* Password wajib di-hash dengan bcrypt (jangan simpan plaintext / hash lemah seperti MD5).
* Access token JWT, klaim minimal: `user_id`, `role`, `exp`. Middleware Actix wajib memvalidasi token di setiap route kecuali `/health` dan `/auth/login`.
* Guard role (`SUPER_ADMIN` vs `ADMIN`) diimplementasikan sebagai middleware/extractor terpisah di `apps/backend/src/middleware/`, jangan dicek manual berulang-ulang di tiap handler.
* Endpoint yang mengubah data sensitif (users, products, addons) hanya untuk `SUPER_ADMIN` — cek Role Matrix di `PRD.md`.

## Error Handling Convention (Baru)
* Semua error harus mengikuti format standar di `API.md` (`success: false`, `message`, `errors`).
* Gunakan custom `AppError` enum di backend yang implement `ResponseError` dari Actix, supaya mapping ke HTTP status code konsisten di semua route — jangan `unwrap()`/`expect()` langsung di handler.

## Environment Variables (Baru)
Dokumentasikan & jaga konsistensi `.env` (jangan commit `.env` asli, hanya `.env.example`):
* `DATABASE_URL` — koneksi MySQL.
* `JWT_SECRET` — secret untuk sign token.
* `JWT_EXPIRES_IN` — durasi access token (mis. `1h`).
* `PORT` — port backend (default 8080).
* `RUST_LOG` — level logging (mis. `info`, `debug`).
* `NEXT_PUBLIC_API_URL` — base URL API yang dipanggil dari browser (frontend).

## Migration & Seed Data (Baru)
* Perubahan skema harus dituliskan sebagai migration file (SeaORM migration atau raw SQL bertingkat), jangan langsung `ALTER TABLE` manual di DB produksi tanpa file migration yang tercatat di repo.
* Sediakan seed data minimal untuk development: 1 user `SUPER_ADMIN`, beberapa kategori produk & bahan baku, agar frontend bisa langsung ditest tanpa input manual dulu.

## Testing (Baru)
* Backend: `cargo test` untuk unit test service layer (terutama logika hitung harga: FIXED/RANGE/CUSTOM + addon + diskon).
* Jangan tulis test yang menyentuh database produksi — gunakan DB testing terpisah atau transaction rollback per test.
