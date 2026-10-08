-- =====================================================================
-- CampusEvent v1.0 - Skema Database (Supabase / PostgreSQL)
-- Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
-- Jalankan SEKALI pada project yang masih kosong. Baca komentarnya dulu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUM (daftar nilai tetap supaya tidak ada typo status)
-- ---------------------------------------------------------------------
create type public.user_role         as enum ('ADMIN', 'PANITIA', 'MAHASISWA');
create type public.event_status      as enum ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');
create type public.payment_status    as enum ('PENDING', 'PAID', 'FAILED');
create type public.payment_method    as enum ('TRANSFER_BANK', 'E_WALLET', 'CASH');
create type public.ticket_status     as enum ('ACTIVE', 'USED', 'CANCELLED');
create type public.notification_type as enum ('REGISTRATION', 'PAYMENT', 'TICKET', 'EVENT_UPDATE', 'EVENT_CANCELLED');

-- ---------------------------------------------------------------------
-- 2. TABEL
-- ---------------------------------------------------------------------

-- Profil pengguna. Login/password disimpan Supabase di auth.users (sudah di-hash).
-- Tabel ini menyimpan data tambahan: nama, NIM, role.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 100),
  nim         text unique check (nim is null or char_length(nim) <= 20),
  email       text not null unique,
  role        public.user_role not null default 'MAHASISWA',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 50),
  description text,
  created_at  timestamptz not null default now()
);

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles(id),
  category_id   uuid not null references public.categories(id),
  title         text not null check (char_length(title) between 3 and 150),
  description   text,
  event_date    date not null,
  start_time    time not null,
  end_time      time,
  location      text not null check (char_length(location) between 2 and 200),
  quota         integer not null check (quota > 0),
  price         integer not null default 0 check (price >= 0),   -- Rupiah, 0 = gratis
  poster_url    text,                                             -- v1: cukup URL gambar
  status        public.event_status not null default 'DRAFT',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);

-- Ada barisnya = mahasiswa terdaftar. Batal daftar = baris dihapus.
create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id),
  event_id    uuid not null references public.events(id),
  created_at  timestamptz not null default now(),
  unique (user_id, event_id)          -- BR-03: tidak boleh daftar dua kali
);

-- Satu pendaftaran = satu pembayaran. amount disalin dari harga event saat daftar,
-- jadi kalau harga event berubah kemudian, pendaftar lama tidak terpengaruh.
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null unique references public.registrations(id) on delete cascade,
  amount           integer not null check (amount >= 0),
  method           public.payment_method,           -- null = belum dipilih / event gratis
  status           public.payment_status not null default 'PENDING',
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- BR-06: satu pendaftaran hanya punya satu tiket.
create table public.tickets (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null unique references public.registrations(id) on delete cascade,
  ticket_code      text not null unique,
  status           public.ticket_status not null default 'ACTIVE',
  issued_at        timestamptz not null default now()
);

-- BR-07: unique(ticket_id) menjamin satu tiket hanya bisa check-in sekali.
create table public.checkins (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null unique references public.tickets(id) on delete cascade,
  checked_in_by  uuid references public.profiles(id),
  checked_in_at  timestamptz not null default now()
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        public.notification_type not null,
  title       text not null,
  message     text not null,
  event_id    uuid references public.events(id) on delete set null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index agar query umum cepat
create index idx_events_status_date   on public.events (status, event_date);
create index idx_events_organizer     on public.events (organizer_id);
create index idx_registrations_event  on public.registrations (event_id);
create index idx_registrations_user   on public.registrations (user_id);
create index idx_notifications_user   on public.notifications (user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------
-- 3. FUNGSI BANTU (dipakai oleh aturan akses & fungsi bisnis)
-- ---------------------------------------------------------------------

-- Role user yang sedang login (null jika belum login atau akun dinonaktifkan)
create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() = 'ADMIN', false)
$$;

-- Apakah user yang login adalah PANITIA pemilik event ini?
create or replace function public.is_organizer_of(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() = 'PANITIA', false)
     and exists (select 1 from public.events
                 where id = p_event_id and organizer_id = auth.uid())
$$;

-- INTERNAL: membuat notifikasi
create or replace function public.create_notification(
  p_user uuid, p_type public.notification_type,
  p_title text, p_message text, p_event uuid)
returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, message, event_id)
  values (p_user, p_type, p_title, p_message, p_event);
$$;

-- INTERNAL: menerbitkan tiket (hanya dipanggil setelah pembayaran PAID)
create or replace function public.issue_ticket(p_registration_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid; v_event uuid; v_title text;
begin
  select r.user_id, r.event_id, e.title into v_user, v_event, v_title
  from public.registrations r join public.events e on e.id = r.event_id
  where r.id = p_registration_id;

  insert into public.tickets (registration_id, ticket_code)
  values (p_registration_id,
          'CE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)))
  on conflict (registration_id) do nothing;

  if found then
    perform public.create_notification(v_user, 'TICKET', 'Tiket diterbitkan',
      'Tiket untuk event "' || v_title || '" sudah tersedia.', v_event);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. TRIGGER
-- ---------------------------------------------------------------------

-- 4a. Setiap akun baru di auth.users otomatis dibuatkan profil.
--     Role SELALU 'MAHASISWA' (abaikan input user) -> mencegah privilege escalation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, nim, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'nim', ''),
    new.email,
    'MAHASISWA'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4b. Hanya ADMIN yang boleh mengubah role / is_active / email di profil.
--     (auth.uid() null = dijalankan lewat SQL Editor/service role, mis. saat seeding -> diizinkan)
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'Anda tidak diizinkan mengubah role, status akun, atau email';
    end if;
  end if;
  return new;
end $$;

create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 4c. Aturan perubahan event (sebelum disimpan)
create or replace function public.events_before_update()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  new.updated_at := now();
  new.organizer_id := old.organizer_id;      -- pemilik event tidak boleh dipindah

  if old.status in ('COMPLETED', 'CANCELLED') then
    raise exception 'Event yang sudah selesai atau dibatalkan tidak dapat diubah';
  end if;

  if new.status <> old.status then
    if not (
         (old.status = 'DRAFT'     and new.status = 'PUBLISHED')
      or (old.status = 'PUBLISHED' and new.status in ('ONGOING', 'CANCELLED'))
      or (old.status = 'ONGOING'   and new.status in ('COMPLETED', 'CANCELLED'))
    ) then
      raise exception 'Perubahan status dari % ke % tidak diizinkan', old.status, new.status;
    end if;
  end if;

  select count(*) into v_count from public.registrations where event_id = old.id;
  if new.quota < v_count then
    raise exception 'Kuota tidak boleh lebih kecil dari jumlah pendaftar saat ini (%)', v_count;
  end if;

  return new;
end $$;

create trigger trg_events_before_update
  before update on public.events
  for each row execute function public.events_before_update();

-- 4d. Efek samping setelah event berubah: batalkan tiket + kirim notifikasi
create or replace function public.events_after_update()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'CANCELLED' and old.status <> 'CANCELLED' then
    update public.tickets set status = 'CANCELLED'
    where status = 'ACTIVE'
      and registration_id in (select id from public.registrations where event_id = new.id);

    insert into public.notifications (user_id, type, title, message, event_id)
    select user_id, 'EVENT_CANCELLED', 'Event dibatalkan',
           'Event "' || new.title || '" telah dibatalkan oleh panitia.', new.id
    from public.registrations where event_id = new.id;

  elsif (new.title, new.event_date, new.start_time, new.end_time, new.location)
        is distinct from
        (old.title, old.event_date, old.start_time, old.end_time, old.location) then
    insert into public.notifications (user_id, type, title, message, event_id)
    select user_id, 'EVENT_UPDATE', 'Informasi event berubah',
           'Informasi event "' || new.title || '" telah diperbarui. Cek detail terbaru.', new.id
    from public.registrations where event_id = new.id;
  end if;
  return null;
end $$;

create trigger trg_events_after_update
  after update on public.events
  for each row execute function public.events_after_update();

-- ---------------------------------------------------------------------
-- 5. FUNGSI BISNIS (dipanggil dari Next.js lewat supabase.rpc('nama_fungsi', {...}))
--    Semua validasi & perubahan data kritis dilakukan DI SINI, dalam satu transaksi.
--    Pesan error (raise exception) berbahasa Indonesia dan boleh ditampilkan ke user.
-- ---------------------------------------------------------------------

-- 5a. Mahasiswa mendaftar event. Mengembalikan id pendaftaran.
create or replace function public.register_for_event(p_event_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_event public.events%rowtype;
  v_count integer;
  v_reg   uuid;
begin
  if v_uid is null then raise exception 'Silakan login terlebih dahulu'; end if;
  if public.get_my_role() is distinct from 'MAHASISWA' then
    raise exception 'Hanya mahasiswa yang dapat mendaftar event';
  end if;

  -- "for update" mengunci baris event: dua orang yang daftar bersamaan
  -- akan diproses satu per satu, sehingga kuota tidak bisa terlampaui (race condition).
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'Event tidak ditemukan'; end if;

  if v_event.status <> 'PUBLISHED' then
    raise exception 'Pendaftaran untuk event ini tidak dibuka';
  end if;
  if v_event.event_date < (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Event ini sudah lewat';
  end if;
  if exists (select 1 from public.registrations where user_id = v_uid and event_id = p_event_id) then
    raise exception 'Anda sudah terdaftar pada event ini';
  end if;

  select count(*) into v_count from public.registrations where event_id = p_event_id;
  if v_count >= v_event.quota then raise exception 'Kuota event sudah penuh'; end if;

  insert into public.registrations (user_id, event_id)
  values (v_uid, p_event_id) returning id into v_reg;

  if v_event.price = 0 then
    insert into public.payments (registration_id, amount, status, paid_at)
    values (v_reg, 0, 'PAID', now());
    perform public.create_notification(v_uid, 'REGISTRATION', 'Pendaftaran berhasil',
      'Anda terdaftar pada event "' || v_event.title || '" (gratis).', p_event_id);
    perform public.issue_ticket(v_reg);
  else
    insert into public.payments (registration_id, amount, status)
    values (v_reg, v_event.price, 'PENDING');
    perform public.create_notification(v_uid, 'REGISTRATION', 'Pendaftaran berhasil',
      'Anda terdaftar pada event "' || v_event.title || '". Silakan lakukan pembayaran.', p_event_id);
  end if;

  return v_reg;
end $$;

-- 5b. Mahasiswa membayar (simulasi). Transfer/E-Wallet langsung PAID.
--     Cash tetap PENDING sampai panitia mengonfirmasi (lihat confirm_payment).
create or replace function public.pay_registration(
  p_registration_id uuid, p_method public.payment_method)
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
  if v_pay.status = 'PAID' then raise exception 'Pembayaran sudah lunas'; end if;

  if p_method = 'CASH' then
    update public.payments set method = 'CASH', status = 'PENDING' where id = v_pay.id;
    return 'PENDING';
  end if;

  update public.payments
     set method = p_method, status = 'PAID', paid_at = now()
   where id = v_pay.id;

  perform public.create_notification(auth.uid(), 'PAYMENT', 'Pembayaran berhasil',
    'Pembayaran untuk event "' || v_event.title || '" berhasil.', v_event.id);
  perform public.issue_ticket(p_registration_id);
  return 'PAID';
end $$;

-- 5c. Panitia (pemilik event) / admin menyetujui atau menolak pembayaran PENDING (mis. Cash).
create or replace function public.confirm_payment(p_registration_id uuid, p_approve boolean)
returns public.payment_status
language plpgsql security definer set search_path = public as $$
declare
  v_reg   public.registrations%rowtype;
  v_pay   public.payments%rowtype;
  v_title text;
begin
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found then raise exception 'Pendaftaran tidak ditemukan'; end if;

  if not (public.is_admin() or public.is_organizer_of(v_reg.event_id)) then
    raise exception 'Anda tidak memiliki akses untuk mengonfirmasi pembayaran ini';
  end if;

  select * into v_pay from public.payments where registration_id = p_registration_id for update;
  if v_pay.status <> 'PENDING' then
    raise exception 'Hanya pembayaran berstatus Pending yang dapat dikonfirmasi';
  end if;

  select title into v_title from public.events where id = v_reg.event_id;

  if p_approve then
    update public.payments set status = 'PAID', paid_at = now() where id = v_pay.id;
    perform public.create_notification(v_reg.user_id, 'PAYMENT', 'Pembayaran berhasil',
      'Pembayaran untuk event "' || v_title || '" telah dikonfirmasi.', v_reg.event_id);
    perform public.issue_ticket(p_registration_id);
    return 'PAID';
  else
    update public.payments set status = 'FAILED' where id = v_pay.id;
    perform public.create_notification(v_reg.user_id, 'PAYMENT', 'Pembayaran ditolak',
      'Pembayaran untuk event "' || v_title || '" ditolak. Silakan coba lagi.', v_reg.event_id);
    return 'FAILED';
  end if;
end $$;

-- 5d. Mahasiswa membatalkan pendaftaran (hanya jika belum PAID). Kuota otomatis kembali.
create or replace function public.cancel_registration(p_registration_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_reg public.registrations%rowtype;
  v_pay public.payments%rowtype;
begin
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found or v_reg.user_id is distinct from auth.uid() then
    raise exception 'Pendaftaran tidak ditemukan';
  end if;

  select * into v_pay from public.payments where registration_id = p_registration_id;
  if v_pay.status = 'PAID' then
    raise exception 'Pendaftaran yang sudah dibayar tidak dapat dibatalkan';
  end if;

  delete from public.registrations where id = p_registration_id;  -- payment ikut terhapus
end $$;

-- 5e. Panitia (pemilik event) / admin melakukan check-in lewat kode tiket.
create or replace function public.check_in(p_ticket_code text, p_event_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ticket  public.tickets%rowtype;
  v_reg     public.registrations%rowtype;
  v_event   public.events%rowtype;
  v_payment public.payments%rowtype;
  v_name    text;
begin
  if not (public.is_admin() or public.is_organizer_of(p_event_id)) then
    raise exception 'Anda tidak memiliki akses untuk check-in event ini';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then raise exception 'Event tidak ditemukan'; end if;

  select * into v_ticket from public.tickets
   where ticket_code = upper(trim(p_ticket_code)) for update;
  if not found then raise exception 'Tiket tidak ditemukan'; end if;

  select * into v_reg from public.registrations where id = v_ticket.registration_id;
  if v_reg.event_id <> p_event_id then
    raise exception 'Tiket ini bukan untuk event yang dipilih';
  end if;
  if v_event.status <> 'ONGOING' then
    raise exception 'Check-in hanya dapat dilakukan saat event berstatus Ongoing';
  end if;
  if v_ticket.status = 'USED' then raise exception 'Tiket sudah digunakan'; end if;
  if v_ticket.status = 'CANCELLED' then raise exception 'Tiket sudah dibatalkan'; end if;

  select * into v_payment from public.payments where registration_id = v_reg.id;
  if v_payment.status is distinct from 'PAID' then
    raise exception 'Pembayaran peserta belum lunas';
  end if;

  update public.tickets set status = 'USED' where id = v_ticket.id;
  insert into public.checkins (ticket_id, checked_in_by) values (v_ticket.id, auth.uid());

  select full_name into v_name from public.profiles where id = v_reg.user_id;
  return jsonb_build_object(
    'participant_name', v_name,
    'ticket_code', v_ticket.ticket_code,
    'event_title', v_event.title);
end $$;

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) - "satpam" di level database
--    RLS aktif + tidak ada policy = ditolak. Semua yang tidak diizinkan di bawah = DITOLAK.
--    Perubahan data penting (registrations, payments, tickets, checkins, notifications)
--    TIDAK punya policy insert/update/delete -> hanya bisa lewat fungsi bisnis di atas.
-- ---------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.events         enable row level security;
alter table public.registrations  enable row level security;
alter table public.payments       enable row level security;
alter table public.tickets        enable row level security;
alter table public.checkins       enable row level security;
alter table public.notifications  enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.registrations r
             join public.events e on e.id = r.event_id
             where r.user_id = profiles.id and e.organizer_id = auth.uid())
);
create policy "profiles_update" on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- categories: semua user login boleh lihat, hanya admin yang mengubah
create policy "categories_select" on public.categories for select to authenticated using (true);
create policy "categories_admin_write" on public.categories for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- events
create policy "events_select" on public.events for select to authenticated
using (status <> 'DRAFT' or organizer_id = auth.uid() or public.is_admin());
create policy "events_insert" on public.events for insert to authenticated
with check (organizer_id = auth.uid() and public.get_my_role() = 'PANITIA');
create policy "events_update" on public.events for update to authenticated
using (public.is_organizer_of(id) or public.is_admin())
with check (public.is_organizer_of(id) or public.is_admin());
create policy "events_delete" on public.events for delete to authenticated
using ((public.is_organizer_of(id) or public.is_admin()) and status = 'DRAFT');

-- registrations / payments / tickets / checkins: hanya BACA
create policy "registrations_select" on public.registrations for select to authenticated
using (user_id = auth.uid() or public.is_organizer_of(event_id) or public.is_admin());

create policy "payments_select" on public.payments for select to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.registrations r
             where r.id = payments.registration_id
               and (r.user_id = auth.uid() or public.is_organizer_of(r.event_id)))
);

create policy "tickets_select" on public.tickets for select to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.registrations r
             where r.id = tickets.registration_id
               and (r.user_id = auth.uid() or public.is_organizer_of(r.event_id)))
);

create policy "checkins_select" on public.checkins for select to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.tickets t
             join public.registrations r on r.id = t.registration_id
             where t.id = checkins.ticket_id
               and (r.user_id = auth.uid() or public.is_organizer_of(r.event_id)))
);

-- notifications: hanya milik sendiri; user hanya boleh mengubah kolom is_read
create policy "notifications_select" on public.notifications for select to authenticated
using (user_id = auth.uid());
create policy "notifications_update" on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant  update (is_read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------
-- 7. VIEW untuk daftar event (sisa kuota terhitung, nama kategori & penyelenggara)
--    Mahasiswa tidak boleh membaca tabel registrations milik orang lain, jadi jumlah
--    pendaftar dihitung di view ini. View jalan sebagai pemilik -> filter DRAFT ditulis manual.
-- ---------------------------------------------------------------------
create or replace view public.events_with_stats as
select
  e.*,
  c.name      as category_name,
  o.full_name as organizer_name,
  (select count(*) from public.registrations r where r.event_id = e.id)::int as registered_count,
  greatest(e.quota - (select count(*) from public.registrations r where r.event_id = e.id), 0)::int
              as remaining_quota
from public.events e
join public.categories c on c.id = e.category_id
join public.profiles   o on o.id = e.organizer_id
where e.status <> 'DRAFT' or e.organizer_id = auth.uid() or public.is_admin();

-- ---------------------------------------------------------------------
-- 8. HAK EKSEKUSI FUNGSI
--    Default Postgres: semua orang boleh menjalankan semua fungsi. Kita batasi.
-- ---------------------------------------------------------------------
revoke all on public.events_with_stats from anon, public;
grant select on public.events_with_stats to authenticated;

-- Fungsi yang boleh dipanggil user login
revoke execute on function public.register_for_event(uuid)                       from public, anon;
revoke execute on function public.pay_registration(uuid, public.payment_method)  from public, anon;
revoke execute on function public.confirm_payment(uuid, boolean)                 from public, anon;
revoke execute on function public.cancel_registration(uuid)                      from public, anon;
revoke execute on function public.check_in(text, uuid)                           from public, anon;
revoke execute on function public.get_my_role()                                  from public, anon;
revoke execute on function public.is_admin()                                     from public, anon;
revoke execute on function public.is_organizer_of(uuid)                          from public, anon;
grant execute on function public.register_for_event(uuid)                        to authenticated;
grant execute on function public.pay_registration(uuid, public.payment_method)   to authenticated;
grant execute on function public.confirm_payment(uuid, boolean)                  to authenticated;
grant execute on function public.cancel_registration(uuid)                       to authenticated;
grant execute on function public.check_in(text, uuid)                            to authenticated;
grant execute on function public.get_my_role()                                   to authenticated;
grant execute on function public.is_admin()                                      to authenticated;
grant execute on function public.is_organizer_of(uuid)                           to authenticated;

-- Fungsi internal: tidak boleh dipanggil langsung dari browser
revoke execute on function public.create_notification(uuid, public.notification_type, text, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.issue_ticket(uuid) from public, anon, authenticated;

-- =====================================================================
-- SELESAI. Langkah berikutnya (manual, lihat SPEC_ADDENDUM.md bagian 9):
--  1. Matikan "Confirm email" di Authentication > Providers > Email (untuk demo)
--  2. Daftarkan akun admin & panitia, lalu naikkan role-nya lewat SQL:
--       update public.profiles set role = 'ADMIN' where email = 'admin@example.com';
-- =====================================================================
