<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# CampusEvent — Konteks Proyek untuk AI

Sistem manajemen event kampus (proyek akademik, **data sintetis saja**). Baca ini di awal setiap sesi.
Dokumen acuan: `docs/Dokumen_Spesifikasi_Perangkat_Lunak_CampusEvent.pdf` dan **`docs/SPEC_ADDENDUM.md`**
(addendum menang jika bertentangan). Skema database ada di `supabase/migrations/001_schema.sql`.

Pemilik proyek **belum berpengalaman di backend**: jelaskan keputusan teknis dengan bahasa sederhana
(Bahasa Indonesia), hindari jargon tanpa penjelasan, dan beri langkah verifikasi manual di setiap akhir tugas.

## Tech stack
Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui · Supabase (Auth + PostgreSQL) ·
`@supabase/ssr` · zod untuk validasi · Git/GitHub. Deploy target: Vercel + Supabase.

## Cara kerja (WAJIB)
1. Awali setiap tugas dengan **rencana singkat** (file yang dibuat/diubah), tunggu persetujuan.
2. Kerjakan **satu iterasi** per sesi. Jangan menambah fitur di luar cakupan iterasi atau di luar scope v1.0.
3. Jangan mengubah `001_schema.sql` yang sudah dijalankan. Perubahan skema = file migration baru
   (`002_...sql`) + jelaskan dampaknya.
4. Jangan menjalankan perintah destruktif (drop/truncate/reset) tanpa izin eksplisit.
5. Akhiri dengan: ringkasan perubahan + checklist pengujian manual.
6. Jika spesifikasi ambigu, **tanyakan**, jangan berasumsi diam-diam.

## Aturan keamanan (tidak boleh dilanggar)
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai di `src/lib/supabase/admin.ts` (diawali `import 'server-only'`)
  dan `scripts/`. **Jangan** memakainya di Client Component, **jangan** diberi awalan `NEXT_PUBLIC_`, jangan di-commit.
- Aplikasi memakai klien Supabase **dengan sesi user** (anon key) agar RLS berlaku. Gunakan service role
  hanya untuk fitur admin yang memang membutuhkannya (mis. membuat akun di Kelola User) **setelah** memverifikasi
  bahwa pemanggil adalah ADMIN di server.
- Di server gunakan `supabase.auth.getUser()` (bukan `getSession()`) untuk mengetahui user.
- Role **tidak pernah** diambil dari input form/klien. Role dibaca dari tabel `profiles`.
- Registrasi publik hanya membuat MAHASISWA (sudah dijaga trigger database).
- Setiap server action: (a) cek login, (b) cek role, (c) validasi input dengan zod, (d) baru jalankan operasi.
- Middleware melindungi route per role (`/admin/*` = ADMIN, `/panitia/*` = PANITIA, sisanya MAHASISWA/login),
  dan menolak user dengan `is_active = false`. Ini lapisan kenyamanan; keamanan sebenarnya di RLS.
- Jangan simpan password sendiri; gunakan Supabase Auth. Jangan log data sensitif.

## Aturan data & bisnis
- **Mengubah** data `registrations`, `payments`, `tickets`, `checkins`, `notifications` hanya lewat RPC:
  `register_for_event`, `pay_registration`, `confirm_payment`, `cancel_registration`, `check_in`.
  Dilarang meniru logikanya dengan `insert/update` dari aplikasi.
- **Membaca** daftar event untuk UI memakai view `events_with_stats` (berisi `remaining_quota`, `category_name`,
  `organizer_name`).
- Pesan error dari RPC sudah berbahasa Indonesia: tampilkan apa adanya ke user (tanpa stack trace).
- Transisi status event diatur trigger database; UI hanya menampilkan tombol transisi yang valid
  (Draft→Published, Published→Ongoing/Cancelled, Ongoing→Completed/Cancelled).
- Uang: integer Rupiah, tampil dengan `Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0})`.
  Waktu: WIB (`Asia/Jakarta`).
- Business rules BR-01…BR-08 pada spesifikasi sudah diimplementasikan di database; jangan dilemahkan.
- Data sintetis saja: email `@example.com`, tidak ada data mahasiswa sungguhan.

## Struktur folder (disarankan)
```
src/
  app/
    (auth)/login, register
    (mahasiswa)/dashboard, events, events/[id], my/registrations, my/tickets, notifications
    panitia/...      admin/...
  components/ui/      # shadcn
  components/         # komponen aplikasi, dikelompokkan per modul
  lib/supabase/       # client.ts (browser), server.ts, admin.ts (server-only), middleware.ts
  lib/validators/     # skema zod
  lib/actions/        # server actions per modul: auth, events, categories, registrations, payments, checkin, users
  types/database.ts   # dibuat dengan `supabase gen types typescript`
scripts/seed.ts       # seeding data sintetis (jalan lokal saja)
supabase/migrations/
docs/
```
Pisahkan kode per modul agar bisa dikembangkan terpisah (NFR-04).

## Konvensi kode
- TypeScript strict, tanpa `any`. Gunakan tipe hasil `supabase gen types`.
- Server Components untuk membaca data; Server Actions untuk mutasi; Client Component hanya untuk interaksi.
- Server action mengembalikan `{ ok: true, data } | { ok: false, error: string }`; UI menampilkan error dengan toast.
- Setiap halaman daftar punya loading state dan **empty state**; form menampilkan error per field.
- UI responsif (mobile-first), terutama tiket dan check-in. Gunakan shadcn/ui + Tailwind, tampilan sederhana dan konsisten.
- Nama file: `kebab-case`; komponen: `PascalCase`; teks UI: Bahasa Indonesia.
- Commit kecil, pesan gaya Conventional Commits (`feat:`, `fix:`, `chore:`).

## Perintah umum
```
npm run dev                      # jalankan lokal
npm run build && npm run lint    # sebelum commit
npx supabase gen types typescript --project-id <ID> > src/types/database.ts
npx tsx scripts/seed.ts          # seed data sintetis (butuh .env.local)
```

## Iterasi (urutan kerja)
1 Foundation · 2 Auth & route guard per role · 3 Kategori & Event (CRUD, listing, detail) · *seed data* ·
4 Registrasi · 5 Pembayaran & Tiket · 6 Check-in · 7 Dashboard, Laporan, Notifikasi · 8 Testing
(skenario T1–T22 di `SPEC_ADDENDUM.md` bagian 10). Prioritas rendah (export, upload poster, QR scanner) hanya jika semua selesai.

## Status saat ini
- [x] Iterasi 1  - [x] Iterasi 2  - [ ] Iterasi 3  - [ ] Seed  - [ ] Iterasi 4
- [ ] Iterasi 5  - [ ] Iterasi 6  - [ ] Iterasi 7  - [ ] Iterasi 8
(Perbarui centang ini setiap iterasi selesai.)


<!-- END:nextjs-agent-rules -->
