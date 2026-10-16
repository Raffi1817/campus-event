-- =====================================================================
-- CampusEvent v1.0 - Migration 002: Storage Bucket untuk Poster Event
-- Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
-- =====================================================================

-- 1. Buat bucket penyimpanan 'event-posters' jika belum ada
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-posters',
  'event-posters',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. Kebijakan RLS (Row Level Security) pada storage.objects
-- Catatan: storage.objects sudah memiliki RLS aktif bawaan Supabase.

-- Bersihkan kebijakan lama jika ada (idempoten)
drop policy if exists "Public Access Event Posters" on storage.objects;
drop policy if exists "Panitia and Admin can upload event posters" on storage.objects;
drop policy if exists "Panitia and Admin can update their event posters" on storage.objects;
drop policy if exists "Panitia and Admin can delete their event posters" on storage.objects;

-- Kebijakan 1: Siapapun (publik dan mahasiswa) dapat melihat poster
create policy "Public Access Event Posters"
on storage.objects for select
using ( bucket_id = 'event-posters' );

-- Kebijakan 2: Hanya PANITIA dan ADMIN yang aktif yang dapat mengunggah poster
-- Berkas disimpan dalam sub-folder ID pengguna: <user_id>/<nama_file>
create policy "Panitia and Admin can upload event posters"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'event-posters'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN' and is_active = true
    )
  )
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('PANITIA', 'ADMIN') and is_active = true
  )
);

-- Kebijakan 3: Pemilik berkas atau ADMIN dapat mengganti/memperbarui poster
create policy "Panitia and Admin can update their event posters"
on storage.objects for update
to authenticated
using (
  bucket_id = 'event-posters'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN' and is_active = true
    )
  )
);

-- Kebijakan 4: Pemilik berkas atau ADMIN dapat menghapus poster
create policy "Panitia and Admin can delete their event posters"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-posters'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN' and is_active = true
    )
  )
);
