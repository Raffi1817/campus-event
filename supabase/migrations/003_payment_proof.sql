-- =====================================================================
-- CampusEvent v1.0 - Migration 003: Bukti Pembayaran (Transfer Bank & E-Wallet)
-- Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
-- =====================================================================

-- 1. Tambah kolom proof_url pada tabel payments jika belum ada
alter table public.payments 
add column if not exists proof_url text;

-- 2. Buat bucket penyimpanan 'payment-proofs' jika belum ada
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 3. Kebijakan RLS (Row Level Security) pada storage.objects untuk payment-proofs
drop policy if exists "Authenticated users can view payment proofs" on storage.objects;
drop policy if exists "Authenticated users can upload payment proofs" on storage.objects;
drop policy if exists "Users can update their payment proofs" on storage.objects;
drop policy if exists "Users can delete their payment proofs" on storage.objects;

-- Kebijakan 1: Pengguna terautentikasi dapat melihat bukti pembayaran
create policy "Authenticated users can view payment proofs"
on storage.objects for select
to authenticated
using ( bucket_id = 'payment-proofs' );

-- Kebijakan 2: Pengguna dapat mengunggah bukti ke folder ID masing-masing: <user_id>/<file>
create policy "Authenticated users can upload payment proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Kebijakan 3: Pengguna atau Admin dapat memperbarui bukti pembayarannya
create policy "Users can update their payment proofs"
on storage.objects for update
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN' and is_active = true
    )
  )
);

-- Kebijakan 4: Pengguna atau Admin dapat menghapus bukti pembayarannya
create policy "Users can delete their payment proofs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN' and is_active = true
    )
  )
);

-- 4. Hapus signature lama pay_registration jika ada agar tidak bentrok
drop function if exists public.pay_registration(uuid, public.payment_method);

-- 5. Perbarui RPC pay_registration dengan parameter p_proof_url
create or replace function public.pay_registration(
  p_registration_id uuid,
  p_method public.payment_method,
  p_proof_url text default null
)
returns public.payment_status
language plpgsql security definer set search_path = public as $$
declare
  v_reg    public.registrations%rowtype;
  v_pay    public.payments%rowtype;
  v_event  public.events%rowtype;
begin
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or v_reg.user_id is distinct from auth.uid() then
    raise exception 'Pendaftaran tidak ditemukan';
  end if;

  select * into v_event from public.events where id = v_reg.event_id;
  if v_event.status not in ('PUBLISHED', 'ONGOING') then
    raise exception 'Event ini tidak lagi menerima pembayaran';
  end if;

  select * into v_pay from public.payments where registration_id = p_registration_id for update;
  if v_pay.status = 'PAID' then 
    raise exception 'Pembayaran sudah lunas'; 
  end if;

  -- Jika metode Tunai (CASH)
  if p_method = 'CASH' then
    update public.payments 
       set method = 'CASH', 
           status = 'PENDING',
           proof_url = null
     where id = v_pay.id;
    return 'PENDING';
  end if;

  -- Jika metode TRANSFER_BANK atau E_WALLET:
  -- Wajib menyertakan bukti pembayaran dan statusnya PENDING menunggu konfirmasi panitia/admin
  if p_proof_url is null or trim(p_proof_url) = '' then
    raise exception 'Bukti pembayaran wajib diunggah untuk Transfer Bank dan E-Wallet';
  end if;

  update public.payments
     set method = p_method, 
         status = 'PENDING', 
         proof_url = p_proof_url
   where id = v_pay.id;

  perform public.create_notification(
    auth.uid(), 
    'PAYMENT', 
    'Bukti pembayaran dikirim',
    'Bukti pembayaran untuk event "' || v_event.title || '" berhasil diunggah. Menunggu konfirmasi panitia.', 
    v_event.id
  );

  return 'PENDING';
end $$;

-- 6. Hak akses eksekusi RPC pay_registration
revoke execute on function public.pay_registration(uuid, public.payment_method, text) from public, anon;
grant execute on function public.pay_registration(uuid, public.payment_method, text) to authenticated;
