# 🚀 Panduan CI/CD, Container GHCR, dan Deployment VPS

Dokumen ini menjelaskan alur **Continuous Integration & Continuous Deployment (CI/CD)** serta panduan optimasi performa untuk aplikasi **Perdana POS & Printing**.

---

## 🏗️ Arsitektur Container & Alur CI/CD

```
  [ Local PC / Git Push ]
            │
            ▼ (Push ke branch master)
  [ GitHub Actions Pipeline ]
   ├── 1. Build & Push Backend ──> ghcr.io/<username>/perdana-backend:latest
   └── 2. Build & Push Frontend ─> ghcr.io/<username>/perdana-frontend:latest
            │
            ▼ (Jika VPS sudah terhubung)
  [ VPS Server (Docker Compose) ]
   ├── perdana-caddy     (Port 80/443 SSL Otomatis & HTTP/3)
   ├── perdana-frontend  (Next.js Standalone dengan Dynamic Import)
   ├── perdana-backend   (Rust Actix-Web + Release Profile LTO)
   └── perdana-db        (MariaDB Database + Automated Indexing)
```

---

## ⚡ 1. Optimasi yang Telah Diterapkan di Aplikasi

1. **Rust Binary Compilation (`Cargo.toml`)**:
   * Menggunakan `opt-level = 3`, `lto = true`, `codegen-units = 1`, `panic = "abort"`, dan `strip = true` untuk menghasilkan executable berukuran ramping (~12 MB) dan eksekusi instruksi CPU tercepat.
2. **Database Performance Indexing (`init.sql` & auto-migration)**:
   * Indeks komposit pada `transactions(order_status, payment_status, created_at)` dan `(customer_id)`.
   * Indeks pada `expenses(expense_date, category)` dan `raw_materials(stock, min_stock_warning)`.
3. **Frontend Dynamic Imports (`pos/page.tsx`)**:
   * Modal berat (Receipt Modal, Banner Calculator, AI Smart Order, Checkout) dimuat secara *lazy/dynamic* saat tombol diklik untuk menjaga waktu render awal *First Load JS* di bawah 300 ms.
4. **Keamanan Rate Limiting Auth (`/api/v1/auth/login`)**:
   * Pembatasan in-memory maksimal 10 percobaan per menit per IP untuk melindungi akun dari serangan brute-force.

---

## 🛠️ 2. Uji Coba Container di Komputer Lokal (Tanpa VPS)

Sebelum deploy ke VPS, Anda bisa mencoba menjalankan seluruh container langsung di laptop/komputer Anda:

1. **Jalankan Docker Compose Produksi**:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```
2. **Cek Status Container**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
3. **Buka Browser**:
   * Akses `http://localhost` (otomatis dilayani oleh Caddy Reverse Proxy).
4. **Matikan Container**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

---

## 🌐 3. Langkah-Langkah Saat Anda Memiliki VPS

Ketika Anda menyewa VPS (misal: IDCloudHost, DigitalOcean, Biznet, Hetzner, Linode, dll):

### Langkah A: Persiapan & Buat Swap Memory di VPS (Wajib untuk VPS 1GB)
1. **Buat Swap File 2 GB (Mencegah Out-Of-Memory)**:
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
2. **Install Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Siapkan Folder Proyek di VPS**:
   ```bash
   mkdir -p /var/www/perdana
   cd /var/www/perdana
   ```
4. **Salin File Konfigurasi ke VPS**:
   Salin file `docker-compose.prod.yml`, `docker/caddy/Caddyfile`, dan `.env` ke folder `/var/www/perdana` di VPS.
5. **Sesuaikan Nama Domain**:
   Di file `docker/caddy/Caddyfile`, ganti `:80` dengan domain Anda (contoh: `pos.perdanaprinting.com`). Caddy otomatis akan mengaktifkan HTTPS/SSL gratis!

---

### Langkah B: Menghubungkan GitHub Actions ke VPS (Otomatisasi Penuh)

Agar setiap Anda melakukan `git push`, server VPS otomatis update:

1. Buka repository Anda di **GitHub**.
2. Masuk ke tab **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Tambahkan 3 Secret berikut:
   * `VPS_HOST`: IP Publik VPS Anda (contoh: `103.186.x.x`).
   * `VPS_USERNAME`: Username login VPS (biasanya `root` atau `ubuntu`).
   * `VPS_SSH_KEY`: Private Key SSH VPS Anda (`~/.ssh/id_rsa`).
   * *(Opsional)* `VPS_PORT`: Port SSH (default `22`).

4. Selesai! Sekarang setiap kali Anda push kode baru ke branch `master`, GitHub Actions akan otomatis meng-compile container image baru dan me-restart container di VPS!

---

## 🔒 Catatan Keamanan Image GHCR
Secara default, package di GHCR bersifat *Private*. Agar VPS Anda bisa mengunduh (*pull*) image tanpa login manual:
1. Masuk ke profil GitHub Anda ➔ **Packages**.
2. Pilih package `perdana-backend` dan `perdana-frontend`.
3. Masuk ke **Package Settings** ➔ ubah visibility menjadi **Public** (atau login sekali di VPS menggunakan `docker login ghcr.io -u <username> -p <github_personal_access_token>`).
