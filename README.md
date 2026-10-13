# 🎓 CampusEvent — Sistem Manajemen Event Kampus

**CampusEvent** adalah platform web terpadu untuk pengelolaan kegiatan dan acara di lingkungan kampus. Sistem ini memfasilitasi publikasi event oleh organisasi kemahasiswaan/panitia, pendaftaran dan simulasi pembayaran peserta oleh mahasiswa, penerbitan tiket digital unik, validasi kehadiran (*check-in*), serta rekapitulasi data dan laporan statistik bagi administrator dan panitia.

---

## 🚀 Fitur Utama Berdasarkan Peran

Aplikasi ini memiliki 3 hak akses pengguna (*Role-Based Access Control*):

### 1. 👨‍🎓 Mahasiswa
- **Eksplorasi Event**: Menjelajahi daftar event yang sedang aktif/dibuka (*Published*), lengkap dengan pencarian dan filter kategori.
- **Detail Event**: Informasi detail mengenai tanggal, waktu (WIB), lokasi, sisa kuota *real-time*, harga, deskripsi, dan penyelenggara.
- **Pendaftaran & Simulasi Pembayaran**:
  - Event gratis langsung mendapatkan tiket digital aktif.
  - Event berbayar mendukung simulasi pembayaran instan (*Transfer Bank* & *E-Wallet*) atau pembayaran tunai (*Cash*) dengan verifikasi panitia.
  - Opsi pembatalan pendaftaran selama belum lunas (kuota otomatis dikembalikan).
- **Tiket Digital**: Akses tiket digital berformat kode unik `CE-XXXXXXXXXX` untuk digunakan saat registrasi kehadiran di lokasi.
- **Riwayat & Notifikasi**: Riwayat pendaftaran aktif/selesai serta notifikasi pembaruan status pendaftaran dan event.

### 2. 📋 Panitia
- **Dashboard Panitia**: Ringkasan jumlah event aktif, total pendaftar, dan tingkat kehadiran.
- **Manajemen Event Mandiri**:
  - Membuat, mengedit, dan mengatur siklus status event (`DRAFT` ➔ `PUBLISHED` ➔ `ONGOING` ➔ `COMPLETED` / `CANCELLED`).
  - Kuota pendaftar terkunci aman dan tidak dapat dikurangi di bawah jumlah pendaftar aktif.
- **Verifikasi Peserta & Pembayaran**: Memantau daftar pendaftar dan melakukan konfirmasi/penolakan pembayaran tunai (*Cash*).
- **Check-in Kehadiran**: Validasi tiket peserta berbasis kode unik tiket secara *real-time* (tiket bertransisi menjadi `USED`).
- **Laporan Event**: Analitik kehadiran dan ringkasan pembayaran per event yang dikelola.

### 3. 🛡️ Administrator
- **Dashboard Eksekutif**: Statistik global kampus (total event, total pendaftar, akumulasi transaksi, dan kehadiran).
- **Kelola Kategori**: Menambah, mengubah nama/deskripsi, dan menghapus kategori event (dilindungi proteksi integritas relasi event).
- **Pengawasan Global**: Melihat seluruh event dari semua organisasi/panitia serta memantau data seluruh pendaftaran di sistem.
- **Laporan Kampus**: Rekapitulasi komprehensif untuk pelaporan tingkat universitas/fakultas.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router) + [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) v4, [Lucide React](https://lucide.dev/) (Icons), [Sonner](https://sonner.emilkowal.ski/) (Toast Notifications)
- **Desain**: Sistem Palet Almamater (*Biru Almamater*, *Kuning Tiket*, *Biru Malam*)
- **Validasi Skema**: [Zod](https://zod.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/)
  - **PostgreSQL Database** dengan skema terstruktur
  - **Supabase Auth** untuk autentikasi sesi pengguna
  - **Row Level Security (RLS)** untuk keamanan data per peran di tingkat database
  - **Database Triggers & RPC (Stored Procedures)** untuk menjamin atomisitas transaksi, pengelolaan kuota, penerbitan tiket, dan validasi *check-in*

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

### 4. Setup Database (Migrasi)
Buka menu **SQL Editor** pada dashboard Supabase Anda, lalu jalankan script yang berada di:
- `supabase/migrations/001_schema.sql`

Skrip ini akan membuat tabel, fungsi RPC, trigger otomatis, dan seluruh aturan *Row Level Security* (RLS).

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

> Anda juga dapat mendaftarkan akun baru secara langsung lewat halaman **Register** (otomatis menjadi Mahasiswa).

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
│   ├── admin/            # Route Admin (Kategori, Event, Laporan, Registrasi)
│   └── panitia/          # Route Panitia (Kelola Event, Check-in, Laporan)
├── components/           # Komponen UI modular & reusable (shadcn, shared layout)
├── constants/            # Nilai konstanta aplikasi
├── docs/                 # Dokumentasi spesifikasi sistem (PDF & Addendum)
├── hooks/                # Custom React hooks
├── lib/
│   ├── actions/          # Next.js Server Actions (Auth, Event, Payment, Checkin, dll.)
│   ├── supabase/         # Client Supabase (browser, server, admin) & middleware
│   └── validators/       # Skema validasi input (Zod)
├── scripts/
│   ├── seed.ts           # Skrip seed data sintetis
│   └── test-scenarios.ts # Skrip pengujian otomatis 22 skenario
├── supabase/
│   └── migrations/       # Skrip migrasi skema SQL & RLS
└── types/                # Tipe TypeScript & Database types
```

---

## 📄 Lisensi & Catatan Akademik
Proyek ini dikembangkan untuk keperluan akademik. Seluruh data yang digunakan dalam contoh dan demo merupakan **data sintetis**.
