# 🎓 CampusEvent — Sistem Manajemen Event Kampus

**CampusEvent** adalah platform web terpadu untuk pengelolaan kegiatan dan acara di lingkungan kampus. Sistem ini memfasilitasi publikasi event oleh organisasi kemahasiswaan/panitia, pendaftaran dan simulasi pembayaran peserta oleh mahasiswa, penerbitan tiket digital unik berbasis QR Code, validasi kehadiran (*check-in*) dengan pemindai kamera, serta rekapitulasi data, manajemen akun pengguna, dan ekspor laporan bagi administrator dan panitia.

---

## 🚀 Fitur Utama Berdasarkan Peran

Aplikasi ini memiliki 3 hak akses pengguna (*Role-Based Access Control*):

### 1. 👨‍🎓 Mahasiswa
- **Beranda & Eksplorasi Event**: Halaman beranda interaktif dengan fitur pencarian cepat (*quick search*), event unggulan (*featured events*), dan filter kategori.
- **Detail Event**: Informasi komprehensif mengenai tanggal, waktu (WIB), lokasi, sisa kuota *real-time*, harga, poster resmi, deskripsi lengkap, dan kontak penyelenggara.
- **Pendaftaran & Pembayaran**:
  - Event gratis langsung mendapatkan tiket digital aktif.
  - Event berbayar mendukung simulasi pembayaran instan (*Transfer Bank* & *E-Wallet*) disertai unggah bukti transfer, atau pembayaran tunai (*Cash*) dengan verifikasi panitia.
  - Opsi pembatalan pendaftaran mandiri selama belum lunas (kuota otomatis dikembalikan ke sistem).
- **Tiket Digital Interaktif**: Tiket digital berformat kode unik `CE-XXXXXXXXXX` yang dilengkapi kode QR dinamis dan modal pratinjau zoom (*QR Zoom*) agar mudah dipindai di lokasi acara.
- **Riwayat & Notifikasi**: Riwayat pendaftaran aktif/selesai serta notifikasi pembaruan status pendaftaran, pembayaran, dan perubahan status event secara *real-time*.

### 2. 📋 Panitia
- **Dashboard Panitia**: Ringkasan metrik jumlah event aktif, total pendaftar, dan persentase kehadiran peserta.
- **Manajemen Event Mandiri**:
  - Membuat, menyunting, dan mengatur siklus status event (`DRAFT` ➔ `PUBLISHED` ➔ `ONGOING` ➔ `COMPLETED` / `CANCELLED`).
  - Unggah poster promosi event langsung ke Supabase Storage.
  - Proteksi kuota: kuota terkunci aman dan tidak dapat dikurangi di bawah jumlah pendaftar aktif.
- **Verifikasi Peserta & Pembayaran**: Memantau daftar pendaftar, meninjau unggahan bukti bayar transfer, dan melakukan konfirmasi/penolakan pembayaran tunai (*Cash*) maupun transfer bank.
- **Check-in Kehadiran Terintegrasi**: Validasi tiket peserta secara *real-time* via kamera pemindai QR Code (*live camera scanner*) atau input manual kode tiket `CE-XXXXXXXXXX` (tiket otomatis bertransisi menjadi `USED`).
- **Laporan & Ekspor Data**: Rekapitulasi analitik kehadiran per event dan ekspor daftar pendaftar/hadir ke format **CSV**.

### 3. 🛡️ Administrator
- **Dashboard Eksekutif**: Statistik global kampus (total event, total pendaftar, akumulasi transaksi, dan rasio kehadiran).
- **Kelola Pengguna (*User Management*)**: Menambah akun baru (Admin, Panitia, Mahasiswa), mengedit data profil/NIM/peran, mengaktifkan/menonaktifkan status akun, dan melakukan reset password.
- **Kelola Kategori**: Menambah, mengubah nama/deskripsi, dan menghapus kategori event (dilindungi proteksi integritas relasi event).
- **Pengawasan Global**: Memantau seluruh event lintas organisasi dan mengawasi seluruh riwayat pendaftaran di sistem kampus.
- **Laporan & Ekspor Kampus**: Rekapitulasi analitik komprehensif tingkat universitas/fakultas serta unduh laporan global dalam format **CSV**.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router) + [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) v4, [Lucide React](https://lucide.dev/) (Icons), [Sonner](https://sonner.emilkowal.ski/) (Toast Notifications)
- **Desain & Tema**: Sistem Palet Almamater (*Biru Almamater*, *Kuning Tiket*, *Biru Malam*)
- **Pemindai & Penerbit QR**: [qrcode.react](https://github.com/zpao/qrcode.react) (QR Generator) & [html5-qrcode](https://scanapp.org/html5-qrcode-docs/) (QR Camera Scanner)
- **Validasi Skema**: [Zod](https://zod.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/)
  - **PostgreSQL Database** dengan skema relasional terstruktur
  - **Supabase Auth** untuk autentikasi sesi dan manajemen pengguna
  - **Supabase Storage** untuk penyimpanan poster event dan bukti pembayaran
  - **Row Level Security (RLS)** untuk keamanan data per peran langsung di tingkat database
  - **Database Triggers & RPC (Stored Procedures)** untuk atomisitas transaksi, alokasi kuota, penerbitan tiket, dan validasi *check-in*

---

## ⚙️ Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi 20 ke atas
- Akun atau project di [Supabase](https://supabase.com/)

### 2. Kloning & Instalasi Dependensi
```bash
git clone https://github.com/Raffi1817/campus-event.git
cd campus-event
npm install
```

### 3. Konfigurasi Environment Variable
Buat file `.env.local` di root proyek dan masukkan kredensial Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Catatan Keamanan**: `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di sisi server dan skrip *seeding/testing*. Jangan pernah mengekspos kunci ini ke sisi browser/klien.

### 4. Setup Database & Storage (Migrasi)
Buka menu **SQL Editor** pada dashboard Supabase Anda, lalu jalankan ketiga file migrasi berikut secara berurutan:

1. `supabase/migrations/001_schema.sql`
   *(Membuat tabel relasional, enum peran & status, view `events_with_stats`, fungsi RPC transaksi, dan kebijakan RLS).*
2. `supabase/migrations/002_storage_posters.sql`
   *(Membuat bucket storage `event-posters` beserta aturan RLS akses unggah & lihat).*
3. `supabase/migrations/003_payment_proof.sql`
   *(Menambahkan kolom `proof_url` pada tabel pembayaran dan membuat bucket storage `payment-proofs`).*

### 5. Seeding Data Sintetis (Demo)
Jalankan perintah berikut untuk mengisi database dengan data dummy awal (kategori, event berbagai status, dan akun uji coba):

```bash
npm run seed
```

### 6. Menjalankan Server Pengembangan
```bash
npm run dev
```

Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

---

## 🔑 Akun Uji Coba (Demo Seed)

Setelah menjalankan `npm run seed`, Anda dapat langsung masuk menggunakan akun berikut:

| Peran (Role) | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `admin123` | Administrator utama kampus |
| **Panitia 1** | `panitia1@gmail.com` | `panitia123` | Budi Santoso (BEM) |
| **Panitia 2** | `panitia2@gmail.com` | `panitia123` | Siti Rahma (HIMATIKA) |
| **Panitia 3** | `panitia3@gmail.com` | `panitia123` | Ahmad Fauzi (UKM Seni) |
| **Mahasiswa** | `mhs1@gmail.com` s.d. `mhs10@gmail.com` | `mahasiswa123` | Mahasiswa terdaftar (contoh: `mhs1@gmail.com`) |

> Anda juga dapat mendaftarkan akun baru secara langsung lewat halaman **Register** (otomatis memiliki peran Mahasiswa).

---

## 📜 Daftar Perintah (*NPM Scripts*)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan Next.js development server lokal |
| `npm run build` | Melakukan build produksi untuk validasi & deployment |
| `npm run start` | Menjalankan server aplikasi versi hasil build |
| `npm run lint` | Menjalankan pengecekan format dan *linting* kode dengan ESLint |
| `npm run seed` | Mengisi database dengan data sintetis untuk pengujian |
| `npm run test:scenarios` | Menjalankan pengujian otomatis 22 skenario bisnis (T1–T22) |

---

## 🧪 Pengujian Skenario Bisnis (T1–T22)

Sistem ini telah dilengkapi dengan skrip pengujian skenario bisnis otomatis yang memvalidasi integritas alur dari awal hingga akhir, meliputi:
- Pendaftaran event gratis & berbayar
- Konsistensi kuota dan pencegahan pendaftaran ganda
- Pembatalan pendaftaran dan pengembalian kuota
- Konfirmasi dan penolakan pembayaran tunai
- Penerbitan tiket digital
- Validasi check-in (*ticket used*, *double check-in rejection*, *ticket not found*, *event status guard*)
- Transisi status event dan isolasi hak akses data antar panitia

Jalankan pengujian dengan:
```bash
npm run test:scenarios
```

---

## 📂 Struktur Proyek Ringkas

```text
├── app/                  # Next.js App Router (Halaman & Layout per peran)
│   ├── (auth)/           # Route Login & Register
│   ├── (mahasiswa)/      # Route Mahasiswa (Dashboard, Event, Tiket, Notifikasi)
│   ├── admin/            # Route Admin (Kategori, Event, Laporan, Registrasi, Kelola User)
│   └── panitia/          # Route Panitia (Kelola Event, Check-in, Laporan Peserta)
├── components/           # Komponen UI modular & reusable (shadcn, checkin, dialog, events)
├── constants/            # Nilai konstanta aplikasi
├── docs/                 # Dokumentasi spesifikasi sistem (PDF & Addendum)
├── hooks/                # Custom React hooks
├── lib/
│   ├── actions/          # Next.js Server Actions (Auth, Event, Payment, Checkin, Users, dll.)
│   ├── supabase/         # Client Supabase (browser, server, admin) & middleware
│   └── validators/       # Skema validasi input (Zod)
├── scripts/
│   ├── seed.ts           # Skrip seed data sintetis
│   └── test-scenarios.ts # Skrip pengujian otomatis 22 skenario
├── supabase/
│   └── migrations/       # Skrip migrasi SQL (001 Skema, 002 Poster, 003 Bukti Bayar)
└── types/                # Tipe TypeScript & Database types
```

---

## 📄 Lisensi & Catatan Akademik
Proyek ini dikembangkan untuk keperluan akademik. Seluruh data yang digunakan dalam contoh dan demo merupakan **data sintetis**.
