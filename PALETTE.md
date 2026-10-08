## 🎨 Color Palette (Design System)

Berikut adalah panduan palet warna resmi yang digunakan di dalam antarmuka CampusEvent:

| Role / Elemen | HEX Code | Keterangan & Penggunaan |
| :--- | :---: | :--- |
| **Background Utama** | `#F6F7FB` | Latar belakang dasar halaman (*Main Background*, tone **Kertas**) |
| **Background Card / Section** | `#FFFFFF` | Latar belakang kartu event, tabel, form, dan popover |
| **Teks Utama** | `#14172B` | Warna tipografi utama (*Tinta*) untuk judul dan body text pada background terang |
| **Teks Sekunder** | `#5B6078` | Teks pendukung seperti tanggal, lokasi, caption, dan placeholder input |
| **Border / Garis** | `#E1E4EE` | Border kartu, pembatas tabel, dan divider |
| **Warna Primer** | `#243B9B` | *Biru Almamater*: tombol utama, navbar, link, dan state navigasi aktif (teks di atasnya `#FFFFFF`) |
| **Primer Soft** | `#DCE3F7` | Latar tint untuk badge Completed, hover, dan item terpilih |
| **Sidebar / Surface Gelap** | `#121F55` | *Biru Malam*: sidebar Admin/Panitia dan section gelap (teks di atasnya `#E6EAFA`) |
| **Warna Aksen** | `#FFD23F` | *Kuning Tiket*: tombol CTA "Daftar", harga, dan motif tiket. Teks di atasnya wajib `#14172B` |

### 🚦 Warna Status (Semantik)

Setiap status memakai tiga warna: **kuat** (titik/border), **soft** (latar badge), dan **ink** (teks badge, kontras ≥ 4.5:1). Warna bukan satu-satunya penanda, jadi selalu sertakan label teks status.

| Status | Kuat | Soft | Ink | Dipakai untuk |
| :--- | :---: | :---: | :---: | :--- |
| **Sukses** | `#0E8A6F` | `#DDF5EE` | `#0A5F4D` | Event `ONGOING`, pembayaran `PAID`, check-in berhasil |
| **Peringatan** | `#E07A00` | `#FFEBD1` | `#8A4B00` | Pembayaran `PENDING`, kuota hampir habis |
| **Bahaya** | `#D1344B` | `#FDE3E7` | `#9B1C31` | Event/tiket `CANCELLED`, pembayaran `FAILED`, check-in ditolak |
| **Info** | `#1F86C7` | `#DFF0FB` | `#0B5A87` | Event `PUBLISHED`, notifikasi informasi |
| **Tiket Aktif** | `#F5B800` | `#FFF3C7` | `#6B4E00` | Tiket berstatus `ACTIVE` |
| **Netral** | `#8087A2` | `#ECEEF5` | `#4A5068` | Event `DRAFT`, tiket `USED`, check-in "Belum hadir" |
