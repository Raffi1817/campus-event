# CampusEvent — Addendum Spesifikasi v1.1

Dokumen ini **melengkapi** Dokumen Spesifikasi v1.0 (draft). Jika ada konflik, **addendum ini yang berlaku**.
Pasangannya: `supabase/migrations/schema.sql` (database) dan `AGENTS.md` (aturan untuk AI coding tool).

---

## 1. Konsep backend yang perlu Anda tahu (5 menit)

Anda tidak perlu menulis kode backend sendiri, tetapi perlu paham 5 istilah ini supaya bisa mereview hasil AI.

| Istilah | Analogi | Di proyek ini |
|---|---|---|
| **Database (PostgreSQL)** | Lemari arsip berisi tabel-tabel | Dibuat di Supabase lewat `supabase/migrations/schema.sql` |
| **Authentication** | Pintu masuk + kartu identitas | Supabase Auth menyimpan email & password (sudah di-hash). Tabel `profiles` menyimpan nama, NIM, role |
| **RLS (Row Level Security)** | Satpam di depan lemari arsip: "Anda hanya boleh melihat baris ini" | Aturan akses per role, tertulis di SQL. Walaupun UI salah, database tetap menolak akses terlarang |
| **Server Action** | Petugas loket di server Next.js. Browser menitip permintaan, petugas yang mengerjakan | Dipakai untuk semua aksi: daftar, bayar, check-in, CRUD event |
| **Function (RPC) & Trigger** | Prosedur baku di dalam database. *Function* dijalankan atas permintaan, *trigger* berjalan otomatis saat data berubah | Aturan penting (kuota, tiket, check-in) ditaruh di sini agar selalu konsisten dan atomik |

**Prinsip utama proyek ini: "validasi di database, bukan hanya di tampilan."**
Tombol yang disembunyikan di UI bukan keamanan. Yang mengamankan adalah RLS dan function di database.

Alur satu aksi (contoh: mahasiswa klik **Daftar**):

```
Browser → Server Action (Next.js) → supabase.rpc('register_for_event')
        → database: cek login, cek status event, cek kuota, cek duplikat, simpan
        → hasil / pesan error kembali ke browser
```

---

## 2. Keputusan desain (menutup celah v1.0)

| # | Topik | Keputusan |
|---|---|---|
| D1 | Event "dibuka" (FR-09) | Status `PUBLISHED` **dan** tanggal event belum lewat (zona WIB) |
| D2 | Kuota terpakai | Setiap pendaftaran langsung memakai 1 kuota, walau belum bayar |
| D3 | Pembayaran Pending | Memegang kuota. Mahasiswa bisa **membatalkan** pendaftaran selama belum PAID (kuota kembali). Kedaluwarsa otomatis **tidak ada** di v1.0 |
| D4 | Event gratis (harga 0) | Pembayaran langsung `PAID` (amount 0), tiket langsung terbit saat daftar |
| D5 | Siapa mengubah status bayar | Mahasiswa memilih metode lalu klik Bayar. **Transfer Bank / E-Wallet → langsung PAID** (simulasi). **Cash → PENDING**, panitia/admin yang menyetujui (PAID) atau menolak (FAILED). Dari FAILED mahasiswa boleh bayar ulang |
| D6 | Status event | Diubah **manual** oleh panitia, tidak otomatis berdasarkan tanggal |
| D7 | Kepemilikan event | Panitia hanya mengelola event **miliknya** (`organizer_id`). Admin dapat melihat dan mengubah semua event |
| D8 | Check-in | Hanya jika event `ONGOING`, tiket `ACTIVE`, tiket milik event itu, dan pembayaran `PAID` |
| D9 | Event dibatalkan | Semua tiket `ACTIVE` jadi `CANCELLED`, semua pendaftar dapat notifikasi. Refund **di luar scope** (data payment tidak diubah) |
| D10 | Edit event | Tidak bisa diedit bila `COMPLETED`/`CANCELLED`. Kuota tidak boleh di bawah jumlah pendaftar. Harga baru tidak memengaruhi pendaftar lama (amount disalin saat daftar) |
| D11 | Hapus event | Hanya `DRAFT`. Event yang sudah dipublikasikan dibatalkan, bukan dihapus |
| D12 | Registrasi publik | Selalu membuat role `MAHASISWA`. Admin/panitia dibuat admin lewat halaman Kelola User |
| D13 | Nonaktifkan user | `is_active = false` → tidak bisa memakai fitur apa pun (role dianggap kosong), dan login ditolak di aplikasi |
| D14 | Poster | v1.0: kolom URL gambar (opsional, ada placeholder). Upload file = prioritas rendah |
| D15 | Ticket code | Format `CE-XXXXXXXXXX` (10 karakter acak), unik |
| D16 | Status kehadiran | "Present" = ada baris di tabel `checkins`. Belum ada = "Belum hadir" |
| D17 | Mata uang & waktu | Rupiah (integer, tampil `Rp 50.000`), zona waktu WIB, tanggal tampil `dd MMM yyyy` |
| D18 | Notifikasi | Dibuat otomatis oleh function/trigger database. Penerima = pemilik pendaftaran. Ada status `is_read` |
| D19 | "Total transaksi" (dashboard) | Jumlah payment berstatus `PAID` + total nominalnya |
| D20 | Email Supabase | Konfirmasi email **dimatikan** untuk demo (email `@example.com` tidak bisa menerima email) |
| D21 | Reset password, edit profil | Di luar scope v1.0, kecuali edit nama oleh pemilik akun (opsional) |

**Perubahan terhadap data sintetis v1.0:** setiap pendaftaran otomatis punya satu baris payment, jadi
`payments = 300` (bukan 250). Lihat bagian 8.

---

## 3. State machine (diagram status)

**Event** (diatur trigger database, transisi lain ditolak)

```
DRAFT ──► PUBLISHED ──► ONGOING ──► COMPLETED
              │            │
              └────────────┴──► CANCELLED
(DRAFT tidak bisa langsung CANCELLED: hapus saja. COMPLETED & CANCELLED = final)
```

**Pembayaran**

```
(daftar) ──► PENDING ──► PAID
                │          ▲
                ▼          │ (bayar ulang / dikonfirmasi panitia)
              FAILED ──────┘
Event gratis: langsung PAID.
```

**Tiket**

```
(terbit saat PAID) ACTIVE ──► USED        (check-in berhasil, final)
                     └──────► CANCELLED   (event dibatalkan, final)
```

---

## 4. Matriks hak akses

✅ boleh · ❌ tidak · 🔸 dengan syarat

| Data / Aksi | Mahasiswa | Panitia | Admin |
|---|---|---|---|
| Lihat daftar event (non-Draft) | ✅ | ✅ | ✅ |
| Lihat event Draft | ❌ | 🔸 miliknya | ✅ |
| Buat event | ❌ | ✅ | ❌ |
| Ubah event | ❌ | 🔸 miliknya | ✅ |
| Hapus event | ❌ | 🔸 miliknya & Draft | ✅ Draft |
| Daftar event | ✅ | ❌ | ❌ |
| Batalkan pendaftaran | 🔸 miliknya & belum PAID | ❌ | ❌ |
| Bayar (simulasi) | 🔸 miliknya | ❌ | ❌ |
| Konfirmasi / tolak pembayaran | ❌ | 🔸 event miliknya | ✅ |
| Lihat peserta & pembayaran | 🔸 hanya miliknya | 🔸 event miliknya | ✅ semua |
| Lihat tiket | 🔸 miliknya | 🔸 event miliknya | ✅ |
| Check-in | ❌ | 🔸 event miliknya | ✅ |
| Kelola kategori | ❌ (lihat saja) | ❌ (lihat saja) | ✅ |
| Kelola user | ❌ | ❌ | ✅ |
| Lihat notifikasi | 🔸 miliknya | 🔸 miliknya | 🔸 miliknya |
| Laporan | ❌ | 🔸 event miliknya | ✅ semua |

---

## 5. Daftar halaman (route) per role

| Role | Route | Fungsi |
|---|---|---|
| Publik | `/login`, `/register` | Masuk / daftar akun mahasiswa |
| Mahasiswa | `/dashboard` | Event diikuti, tiket aktif, notifikasi terbaru |
| | `/events` | Daftar event + cari nama + filter kategori |
| | `/events/[id]` | Detail event + tombol Daftar |
| | `/my/registrations` | Riwayat pendaftaran, status bayar, tombol Bayar / Batalkan |
| | `/my/tickets` | Tiket (kode, status, QR jika ada), status check-in |
| | `/notifications` | Daftar notifikasi |
| Panitia | `/panitia/dashboard` | Statistik event yang dikelola |
| | `/panitia/events`, `/new`, `/[id]/edit` | CRUD event + ubah status |
| | `/panitia/events/[id]/participants` | Peserta + status bayar + tombol konfirmasi Cash |
| | `/panitia/events/[id]/checkin` | Input kode tiket, hasil check-in |
| | `/panitia/reports` | Laporan event miliknya |
| Admin | `/admin/dashboard` | Total user, event, pendaftar, hadir, transaksi |
| | `/admin/users` | Daftar, tambah, ubah, ubah role, nonaktifkan |
| | `/admin/categories` | CRUD kategori |
| | `/admin/events`, `/admin/registrations`, `/admin/reports` | Pantau semua data |

Semua halaman wajib responsif (mobile-first), terutama `/my/tickets` dan `/panitia/events/[id]/checkin`
karena dipakai lewat ponsel. Setiap halaman daftar punya **empty state** (pesan jika data kosong).

---

## 6. Aturan validasi input (di form **dan** di server)

| Field | Aturan |
|---|---|
| Nama | 2–100 karakter |
| NIM | Opsional untuk panitia/admin, unik, maks 20 karakter |
| Email | Format valid, unik |
| Password | Minimal 8 karakter |
| Judul event | 3–150 karakter |
| Tanggal event | Tidak boleh di masa lalu saat **membuat** event |
| Waktu selesai | Harus setelah waktu mulai (jika diisi) |
| Kuota | Bilangan bulat > 0 |
| Harga | Bilangan bulat ≥ 0 (0 = gratis) |
| Kategori | Wajib dipilih, nama kategori unik |

Gunakan **zod** untuk validasi di server action. Validasi di database (CHECK constraint) adalah lapis kedua.

---

## 7. Alur kritis: siapa mengerjakan apa

| Aksi | Dipanggil lewat | Yang dicek di database |
|---|---|---|
| Daftar event | `rpc('register_for_event', {p_event_id})` | Login, role mahasiswa, status Published, tanggal, duplikat, kuota (dengan penguncian baris) |
| Bayar | `rpc('pay_registration', {p_registration_id, p_method})` | Milik sendiri, event belum selesai, belum PAID. Lalu terbitkan tiket |
| Konfirmasi Cash | `rpc('confirm_payment', {p_registration_id, p_approve})` | Panitia pemilik event atau admin, status Pending |
| Batal daftar | `rpc('cancel_registration', {p_registration_id})` | Milik sendiri, belum PAID |
| Check-in | `rpc('check_in', {p_ticket_code, p_event_id})` | Akses panitia, tiket sesuai event, event Ongoing, belum Used, pembayaran PAID |
| CRUD event | `supabase.from('events')...` | RLS + trigger transisi status |
| CRUD kategori | `supabase.from('categories')...` | RLS (admin saja) |
| Baca daftar event | `supabase.from('events_with_stats')...` | Sudah termasuk sisa kuota |

Aturan praktis: **membaca** data boleh langsung dari tabel/view (RLS menjaga). **Mengubah** data
registrasi, payment, ticket, check-in, notifikasi **hanya** lewat function di atas.

---

## 8. Data sintetis (revisi)

| Data | Jumlah | Catatan |
|---|---|---|
| Users | 100 | 1 admin, 5 panitia, 94 mahasiswa. Email `...@example.com`, password demo sama untuk semua (mis. `Password123!`) |
| Categories | 8 | Seminar, Workshop, Lomba, Pelatihan, Organisasi, Olahraga, Seni & Budaya, Karier |
| Events | 20 | Campuran: ±2 Draft, ±8 Published, ±2 Ongoing, ±6 Completed, ±2 Cancelled. Campur event gratis & berbayar. Tiap panitia memiliki ≥1 event |
| Registrations | 300 | Tidak melebihi kuota, tidak ada duplikat user+event, tidak ada pendaftar di event Draft |
| Payments | 300 | 1 per registrasi: 250 PAID, 30 PENDING, 20 FAILED |
| Tickets | 250 | 1 per payment PAID |
| Check-ins | 150 | Hanya dari tiket di event Ongoing/Completed. Tiket yang di-check-in berstatus USED |
| Notifications | 300 | Merujuk user & event yang ada |

Kekonsistenan wajib: check-in (150) ≤ tiket (250) = payment PAID (250) ≤ registrasi (300).

**Catatan teknis seeding:** akun login tidak bisa dibuat dengan `INSERT` biasa ke `auth.users`. Buat script
`scripts/seed.ts` yang memakai **Supabase Admin API** (`auth.admin.createUser`, butuh service role key, jalankan
**hanya di komputer lokal**, jangan pernah di browser/Git). Trigger akan membuat profil otomatis; role
admin/panitia dinaikkan setelahnya lewat `update profiles set role = ...` (diizinkan karena dijalankan tanpa sesi user).
Untuk data event/registrasi/payment/tiket/check-in, **insert langsung dengan status akhir** (jangan memanggil function bisnis
berulang-ulang), agar cepat dan konsisten.

---

## 9. Langkah kerja untuk pemula (urutan yang disarankan)

**Tahap A — Persiapan (manual, tanpa AI)**
1. Buat repo GitHub + clone ke komputer. Install Node.js LTS.
2. `npx create-next-app@latest` (TypeScript, Tailwind, App Router).
3. Buat project di supabase.com. Dari *Project Settings → API* catat **Project URL** dan **anon key**; catat juga **service role key** (rahasia).
4. Buat `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...      # hanya server/seed, TANPA awalan NEXT_PUBLIC_
   ```
   Pastikan `.env*` ada di `.gitignore`.
5. Supabase → *Authentication → Providers → Email* → matikan **Confirm email**.
6. Letakkan `AGENTS.md` di root repo, `SPEC_ADDENDUM.md` + spesifikasi asli (PDF/MD) di folder `docs/`, `schema.sql` di `supabase/migrations/`.
7. **Baca dan jalankan** `schema.sql` di *SQL Editor*. Bila ada error, salin pesannya ke AI untuk diperbaiki, jangan menjalankan separuh-separuh.
8. Daftarkan akun admin lewat aplikasi (atau Dashboard → Authentication → Add user), lalu di SQL Editor:
   `update public.profiles set role = 'ADMIN' where email = 'admin@example.com';`


**Tahap B — Implementasi per iterasi (dengan AI)**
Ikuti 8 iterasi di spesifikasi bagian 17. Template prompt tiap iterasi:

```
Baca AGENTS.md dan docs/SPEC_ADDENDUM.md. Kita mengerjakan Iterasi N: <nama>.
Cakupan: <daftar fitur dari spesifikasi>.
Buat rencana langkah dulu (file apa yang dibuat/diubah) dan tunggu persetujuan saya.
Setelah disetujui, implementasikan. Jangan menambah fitur di luar cakupan.
Di akhir, berikan checklist cara saya mengujinya secara manual.
```

Setelah AI selesai: jalankan aplikasi, uji manual sesuai bagian 10, perbaiki, **commit**, baru lanjut.

**Urutan iterasi yang saya sarankan** (sedikit disesuaikan): 1 Foundation → 2 Auth + route guard per role →
3 Kategori & Event → **seed data sintetis** (sebelum iterasi 4, agar mudah diuji) → 4 Registrasi → 5 Pembayaran & Tiket →
6 Check-in → 7 Dashboard, Laporan, Notifikasi → 8 Testing.

---

## 10. Skenario uji (Given / When / Then)

| # | Skenario | Hasil yang diharapkan |
|---|---|---|
| T1 | Registrasi dengan email baru | Akun dibuat, role MAHASISWA |
| T2 | Registrasi dengan email yang sudah ada | Ditolak, pesan jelas |
| T3 | Registrasi sambil mencoba mengirim role ADMIN (via DevTools) | Tetap MAHASISWA |
| T4 | Mahasiswa membuka `/admin/users` | Dialihkan / ditolak |
| T5 | Panitia A membuka event milik panitia B | Tidak bisa melihat peserta / mengubah |
| T6 | Daftar event saat kuota = 1 sisa, dua mahasiswa klik bersamaan | Hanya satu berhasil |
| T7 | Daftar event yang sama dua kali | Ditolak |
| T8 | Daftar event berstatus Draft / Cancelled / Completed | Ditolak |
| T9 | Event gratis: daftar | Langsung PAID + tiket terbit |
| T10 | Event berbayar: bayar via E-Wallet | PAID, tiket terbit, notifikasi muncul |
| T11 | Bayar Cash | Tetap PENDING; setelah panitia konfirmasi → PAID + tiket |
| T12 | Panitia menolak Cash | FAILED; mahasiswa bisa bayar ulang |
| T13 | Batalkan pendaftaran yang PENDING | Pendaftaran hilang, kuota bertambah |
| T14 | Batalkan pendaftaran yang sudah PAID | Ditolak |
| T15 | Check-in saat event masih Published | Ditolak (harus Ongoing) |
| T16 | Check-in tiket valid saat Ongoing | Berhasil, tiket USED, status hadir tampil |
| T17 | Check-in tiket yang sama lagi | Ditolak "sudah digunakan" |
| T18 | Check-in tiket event lain | Ditolak |
| T19 | Batalkan event yang sudah punya peserta | Tiket jadi CANCELLED, notifikasi terkirim |
| T20 | Turunkan kuota di bawah jumlah pendaftar | Ditolak |
| T21 | Ubah status Completed → Published | Ditolak |
| T22 | Admin menonaktifkan user lalu user itu login | Ditolak |

Targetkan semua T1–T22 lulus sebelum dinyatakan selesai (memetakan ke 14 acceptance criteria v1.0).

---

## 11. Yang tetap di luar scope v1.0

Refund, kedaluwarsa pembayaran otomatis, reset password, email/WhatsApp nyata, payment gateway nyata,
upload poster ke Storage (kecuali sisa waktu), QR scanner kamera, export PDF/Excel (kecuali sisa waktu).
