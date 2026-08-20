# 🚀 Panduan CI/CD, Container GHCR, dan Deployment VPS

Dokumen ini menjelaskan alur **Continuous Integration & Continuous Deployment (CI/CD)** untuk aplikasi **Perdana POS & Printing**.

---

## 🏗️ Arsitektur Container & Alur CI/CD

```
  [ Local PC / Git Push ]
            │
            ▼ (Push ke branch main)
  [ GitHub Actions Pipeline ]
   ├── 1. Build & Push Backend ──> ghcr.io/<username>/perdana-backend:latest
   └── 2. Build & Push Frontend ─> ghcr.io/<username>/perdana-frontend:latest
            │
            ▼ (Jika VPS sudah terhubung)
  [ VPS Server (Docker Compose) ]
   ├── perdana-caddy     (Port 80/443 SSL Otomatis)
   ├── perdana-frontend  (Next.js Standalone)
   ├── perdana-backend   (Rust Actix-Web)
   └── perdana-db        (MariaDB Database)
```

---

## 🛠️ 1. Uji Coba Container di Komputer Lokal (Tanpa VPS)

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

## 🌐 2. Langkah-Langkah Saat Anda Nanti Sudah Memiliki VPS

Ketika Anda sudah menyewa VPS (misal: DigitalOcean, IDCloudHost, Biznet, Linode, Hetzner, dll):

### Langkah A: Persiapan di VPS
1. **Install Docker & Docker Compose di VPS**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. **Siapkan Folder Proyek di VPS**:
   ```bash
   mkdir -p /var/www/perdana
   cd /var/www/perdana
   ```
3. **Salin File Konfigurasi ke VPS**:
   Salin file `docker-compose.prod.yml`, `docker/caddy/Caddyfile`, dan `.env` ke folder `/var/www/perdana` di VPS.
4. **Sesuaikan Nama Domain**:
   Di file `docker/caddy/Caddyfile`, ganti `:80` dengan domain Anda (contoh: `pos.perdanaprinting.com`). Caddy otomatis akan mengaktifkan HTTPS gratis!

---

### Langkah B: Menghubungkan GitHub Actions ke VPS (Otomatisasi)

Agar setiap Anda melakukan `git push`, server VPS otomatis update:

1. Buka repository Anda di **GitHub**.
2. Masuk ke tab **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Tambahkan 3 Secret berikut:
   * `VPS_HOST`: IP Publik VPS Anda (contoh: `103.186.x.x`).
   * `VPS_USERNAME`: Username login VPS (biasanya `root` atau `ubuntu`).
   * `VPS_SSH_KEY`: Private Key SSH VPS Anda (`~/.ssh/id_rsa`).
   * *(Opsional)* `VPS_PORT`: Port SSH (default `22`).

4. Selesai! Sekarang setiap kali Anda push kode baru ke branch `main`, GitHub Actions akan otomatis:
   * Meng-compile image container baru.
   * Menyimpan ke **GitHub Container Registry (GHCR)**.
   * Menghubungi VPS Anda via SSH dan merestart container ke versi terbaru!

---

## 🔒 Catatan Keamanan Image GHCR
Secara default, package di GHCR bersifat *Private*. Agar VPS Anda bisa mengunduh (*pull*) image tanpa login manual:
1. Masuk ke profil GitHub Anda ➔ **Packages**.
2. Pilih package `perdana-backend` dan `perdana-frontend`.
3. Masuk ke **Package Settings** ➔ ubah visibility menjadi **Public** (atau login sekali di VPS menggunakan `docker login ghcr.io -u <username> -p <github_personal_access_token>`).
