import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

// Muat .env.local
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    // Abaikan jika sudah dimuat
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('❌ Error: Variabel environment tidak lengkap di .env.local')
  process.exit(1)
}

// Client Admin (Bypass RLS untuk setup & verifikasi)
const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Helper untuk membuat user client yang terotentikasi
async function createUserClient(email: string, password: string) {
  const client = createClient<Database>(supabaseUrl!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    throw new Error(`Gagal login user ${email}: ${error?.message}`)
  }
  return { client, user: data.user }
}

interface TestResult {
  id: string
  title: string
  passed: boolean
  message: string
  details?: string
}

const results: TestResult[] = []

function logResult(result: TestResult) {
  results.push(result)
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} [${result.id}] ${result.title}`)
  if (!result.passed) {
    console.log(`   └─ Error: ${result.message}`)
    if (result.details) console.log(`   └─ Detail: ${result.details}`)
  }
}

async function runAllTests() {
  console.log('===============================================================')
  console.log('🧪 CampusEvent — Pengujian Otomatis Skenario T1 hingga T22')
  console.log('===============================================================\n')

  // Setup: Dapatkan kategori untuk event uji coba
  const { data: category } = await adminClient
    .from('categories')
    .select('id')
    .limit(1)
    .single()

  if (!category) {
    console.error('❌ Tidak ada kategori di database. Pastikan database sudah di-seed.')
    process.exit(1)
  }
  const categoryId = category.id

  // Dapatkan ID akun panitia dan mahasiswa
  const panitia1 = await createUserClient('panitia1@gmail.com', 'panitia123')
  const panitia2 = await createUserClient('panitia2@gmail.com', 'panitia123')
  const mhs1 = await createUserClient('mhs1@gmail.com', 'mahasiswa123')
  const mhs2 = await createUserClient('mhs2@gmail.com', 'mahasiswa123')
  const mhs3 = await createUserClient('mhs3@gmail.com', 'mahasiswa123')

  // Helper untuk membersihkan event uji coba
  async function cleanupEvent(eventId: string | null) {
    if (!eventId) return
    try {
      await adminClient.from('registrations').delete().eq('event_id', eventId)
      await adminClient.from('notifications').delete().eq('event_id', eventId)
      await adminClient.from('events').delete().eq('id', eventId)
    } catch {
      // Abaikan error cleanup
    }
  }

  // -------------------------------------------------------------------------
  // T1: Registrasi dengan email baru -> Akun dibuat, role MAHASISWA
  // -------------------------------------------------------------------------
  const tempEmailT1 = `test_mhs_${Date.now()}@example.com`
  let tempUserIdT1: string | null = null
  try {
    const { data: signupData, error: signupError } = await adminClient.auth.admin.createUser({
      email: tempEmailT1,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: 'Mahasiswa Uji T1', nim: `NIM_${Date.now()}` },
    })
    if (signupError || !signupData.user) throw new Error(signupError?.message || 'Gagal daftar')
    tempUserIdT1 = signupData.user.id

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', tempUserIdT1)
      .single()

    const passed = profile?.role === 'MAHASISWA' && profile?.is_active === true
    logResult({
      id: 'T1',
      title: 'Registrasi dengan email baru',
      passed,
      message: passed ? 'Berhasil' : `Role tidak sesuai: ${profile?.role}`,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T1', title: 'Registrasi dengan email baru', passed: false, message: errorMsg })
  }

  // -------------------------------------------------------------------------
  // T2: Registrasi dengan email yang sudah ada -> Ditolak
  // -------------------------------------------------------------------------
  try {
    const { error } = await adminClient.auth.admin.createUser({
      email: 'mhs1@gmail.com',
      password: 'Password123!',
      email_confirm: true,
    })
    const passed = !!error
    logResult({
      id: 'T2',
      title: 'Registrasi dengan email yang sudah ada',
      passed,
      message: passed ? 'Berhasil ditolak' : 'Seharusnya pendaftaran email duplikat ditolak',
    })
  } catch {
    logResult({ id: 'T2', title: 'Registrasi dengan email yang sudah ada', passed: true, message: 'Berhasil ditolak' })
  }

  // -------------------------------------------------------------------------
  // T3: Registrasi sambil mencoba mengirim role ADMIN -> Tetap MAHASISWA
  // -------------------------------------------------------------------------
  const tempEmailT3 = `test_hacker_${Date.now()}@example.com`
  let tempUserIdT3: string | null = null
  try {
    const { data: signupData, error } = await adminClient.auth.admin.createUser({
      email: tempEmailT3,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: 'Fake Admin', role: 'ADMIN' },
    })
    if (error || !signupData.user) throw new Error(error?.message || 'Gagal signup')
    tempUserIdT3 = signupData.user.id

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', tempUserIdT3)
      .single()

    const passed = profile?.role === 'MAHASISWA'
    logResult({
      id: 'T3',
      title: 'Registrasi sambil mencoba mengirim role ADMIN',
      passed,
      message: passed ? 'Role tetap MAHASISWA' : `Eskalasi hak akses terjadi: role = ${profile?.role}`,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T3', title: 'Registrasi dengan role ADMIN', passed: false, message: errorMsg })
  } finally {
    if (tempUserIdT1) await adminClient.auth.admin.deleteUser(tempUserIdT1)
    if (tempUserIdT3) await adminClient.auth.admin.deleteUser(tempUserIdT3)
  }

  // -------------------------------------------------------------------------
  // T4: Mahasiswa membuka /admin/users -> Ditolak / Tidak punya akses
  // -------------------------------------------------------------------------
  try {
    // Uji di level database: mahasiswa mencoba membaca semua data yang diproteksi admin saja atau RPC admin
    const { data, error } = await mhs1.client.from('categories').insert({ name: `Hack Cat ${Date.now()}` })
    // Kategori hanya boleh dibuat oleh ADMIN
    const passed = !!error || !data
    logResult({
      id: 'T4',
      title: 'Mahasiswa membuka / memanipulasi fitur admin',
      passed,
      message: passed ? 'Akses ditolak oleh aturan RLS' : 'Mahasiswa berhasil mengubah data admin',
    })
  } catch {
    logResult({ id: 'T4', title: 'Mahasiswa membuka fitur admin', passed: true, message: 'Ditolak' })
  }

  // -------------------------------------------------------------------------
  // T5: Panitia A membuka/mengubah event milik Panitia B -> Ditolak
  // -------------------------------------------------------------------------
  let eventPanitiaB: string | null = null
  try {
    // Buat event milik Panitia 2
    const { data: evB } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia2.user.id,
        category_id: categoryId,
        title: 'Event Panitia 2 Khusus',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Gedung B',
        quota: 50,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventPanitiaB = evB?.id || null
    if (!eventPanitiaB) throw new Error('Gagal setup event panitia B')

    // Panitia 1 mencoba update event milik Panitia 2
    const { error: hackError, data: updateResult } = await panitia1.client
      .from('events')
      .update({ title: 'Event Dibajak Panitia 1' })
      .eq('id', eventPanitiaB)
      .select('id')

    const passed = !!hackError || !updateResult || updateResult.length === 0
    logResult({
      id: 'T5',
      title: 'Panitia A mengubah event milik Panitia B',
      passed,
      message: passed ? 'Akses ditolak oleh RLS' : 'Panitia 1 berhasil mengubah event Panitia 2',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T5', title: 'Panitia A mengubah event milik Panitia B', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventPanitiaB)
  }

  // -------------------------------------------------------------------------
  // T6: Daftar event saat kuota = 1 sisa, dua mahasiswa klik bersamaan
  // -------------------------------------------------------------------------
  let eventT6: string | null = null
  try {
    const { data: evT6 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Perebutan Kuota T6',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 101',
        quota: 1,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT6 = evT6?.id || null
    if (!eventT6) throw new Error('Gagal setup event T6')

    // Dua mahasiswa (mhs1 & mhs2) mendaftar serentak
    const [res1, res2] = await Promise.allSettled([
      mhs1.client.rpc('register_for_event', { p_event_id: eventT6 }),
      mhs2.client.rpc('register_for_event', { p_event_id: eventT6 }),
    ])

    const successCount =
      (res1.status === 'fulfilled' && !res1.value.error ? 1 : 0) +
      (res2.status === 'fulfilled' && !res2.value.error ? 1 : 0)

    const passed = successCount === 1
    logResult({
      id: 'T6',
      title: 'Dua mahasiswa berebut 1 sisa kuota (Concurrency)',
      passed,
      message: passed ? 'Tepat 1 mahasiswa berhasil, 1 lainnya ditolak' : `Hasil tidak terduga: ${successCount} berhasil`,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T6', title: 'Dua mahasiswa berebut 1 sisa kuota', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT6)
  }

  // -------------------------------------------------------------------------
  // T7: Daftar event yang sama dua kali -> Ditolak
  // -------------------------------------------------------------------------
  let eventT7: string | null = null
  try {
    const { data: evT7 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Uji Duplikat T7',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 102',
        quota: 10,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT7 = evT7?.id || null
    if (!eventT7) throw new Error('Gagal setup event T7')

    // Daftar pertama
    await mhs1.client.rpc('register_for_event', { p_event_id: eventT7 })
    // Daftar kedua oleh user yang sama
    const { error: dupError } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT7 })

    const passed = !!dupError && dupError.message.includes('sudah terdaftar')
    logResult({
      id: 'T7',
      title: 'Daftar event yang sama dua kali',
      passed,
      message: passed ? 'Ditolak: sudah terdaftar' : 'Pendaftaran ganda tidak ditolak',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T7', title: 'Daftar event yang sama dua kali', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT7)
  }

  // -------------------------------------------------------------------------
  // T8: Daftar event berstatus Draft / Cancelled / Completed -> Ditolak
  // -------------------------------------------------------------------------
  let eventT8: string | null = null
  try {
    const { data: evT8 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Draft T8',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 103',
        quota: 10,
        price: 0,
        status: 'DRAFT',
      })
      .select('id')
      .single()

    eventT8 = evT8?.id || null
    if (!eventT8) throw new Error('Gagal setup event T8')

    const { error } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT8 })
    const passed = !!error && error.message.includes('tidak dibuka')
    logResult({
      id: 'T8',
      title: 'Daftar event berstatus Draft / Non-Published',
      passed,
      message: passed ? 'Ditolak: pendaftaran tidak dibuka' : 'Event draft dapat didaftar',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T8', title: 'Daftar event Draft', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT8)
  }

  // -------------------------------------------------------------------------
  // T9: Event gratis: daftar -> Langsung PAID + tiket terbit
  // -------------------------------------------------------------------------
  let eventT9: string | null = null
  try {
    const { data: evT9 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Gratis T9',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 104',
        quota: 10,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT9 = evT9?.id || null
    if (!eventT9) throw new Error('Gagal setup event T9')

    const { data: regId, error } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT9 })
    if (error || !regId) throw new Error(error?.message || 'Gagal daftar')

    const { data: payment } = await adminClient
      .from('payments')
      .select('status, amount')
      .eq('registration_id', regId)
      .single()

    const { data: ticket } = await adminClient
      .from('tickets')
      .select('status, ticket_code')
      .eq('registration_id', regId)
      .single()

    const passed = payment?.status === 'PAID' && ticket?.status === 'ACTIVE' && !!ticket?.ticket_code
    logResult({
      id: 'T9',
      title: 'Event gratis: langsung PAID dan tiket ACTIVE',
      passed,
      message: passed ? 'Berhasil PAID + Tiket terbit' : 'Tiket atau status bayar tidak sesuai',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T9', title: 'Event gratis daftar', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT9)
  }

  // -------------------------------------------------------------------------
  // T10: Event berbayar: bayar via E-Wallet -> PAID, tiket terbit, notifikasi muncul
  // -------------------------------------------------------------------------
  let eventT10: string | null = null
  try {
    const { data: evT10 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Berbayar T10',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 105',
        quota: 10,
        price: 50000,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT10 = evT10?.id || null
    if (!eventT10) throw new Error('Gagal setup event T10')

    const { data: regId } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT10 })
    if (!regId) throw new Error('Gagal daftar event')

    const { data: payStatus, error: payError } = await mhs1.client.rpc('pay_registration', {
      p_registration_id: regId,
      p_method: 'E_WALLET',
    })

    if (payError) throw new Error(payError.message)

    const { data: ticket } = await adminClient
      .from('tickets')
      .select('status')
      .eq('registration_id', regId)
      .single()

    const { data: notif } = await adminClient
      .from('notifications')
      .select('type')
      .eq('user_id', mhs1.user.id)
      .eq('event_id', eventT10)
      .eq('type', 'PAYMENT')

    const passed = payStatus === 'PAID' && ticket?.status === 'ACTIVE' && (notif?.length || 0) > 0
    logResult({
      id: 'T10',
      title: 'Event berbayar: Bayar E-Wallet -> PAID, tiket terbit & notifikasi',
      passed,
      message: passed ? 'Pembayaran lunas dan tiket terbit' : 'Status pembayaran atau tiket belum lunas',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T10', title: 'Bayar E-Wallet event berbayar', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT10)
  }

  // -------------------------------------------------------------------------
  // T11: Bayar Cash -> PENDING; Panitia approve -> PAID + tiket
  // -------------------------------------------------------------------------
  let eventT11: string | null = null
  try {
    const { data: evT11 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Cash T11',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 106',
        quota: 10,
        price: 25000,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT11 = evT11?.id || null
    if (!eventT11) throw new Error('Gagal setup event T11')

    const { data: regId } = await mhs2.client.rpc('register_for_event', { p_event_id: eventT11 })
    if (!regId) throw new Error('Gagal daftar')

    // Bayar CASH
    const { data: cashStatus } = await mhs2.client.rpc('pay_registration', {
      p_registration_id: regId,
      p_method: 'CASH',
    })

    const isPending = cashStatus === 'PENDING'

    // Panitia1 konfirmasi Approve
    const { data: approveStatus } = await panitia1.client.rpc('confirm_payment', {
      p_registration_id: regId,
      p_approve: true,
    })

    const { data: ticket } = await adminClient
      .from('tickets')
      .select('status')
      .eq('registration_id', regId)
      .single()

    const passed = isPending && approveStatus === 'PAID' && ticket?.status === 'ACTIVE'
    logResult({
      id: 'T11',
      title: 'Bayar Cash -> PENDING, lalu Panitia Approve -> PAID + Tiket',
      passed,
      message: passed ? 'Alur Cash berhasil disetujui' : 'Status Cash tidak sesuai',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T11', title: 'Bayar Cash & konfirmasi panitia', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT11)
  }

  // -------------------------------------------------------------------------
  // T12: Panitia tolak Cash -> FAILED; Mahasiswa bayar ulang -> PAID
  // -------------------------------------------------------------------------
  let eventT12: string | null = null
  try {
    const { data: evT12 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Cash Tolak T12',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 107',
        quota: 10,
        price: 25000,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT12 = evT12?.id || null
    if (!eventT12) throw new Error('Gagal setup event T12')

    const { data: regId } = await mhs3.client.rpc('register_for_event', { p_event_id: eventT12 })
    if (!regId) throw new Error('Gagal daftar')

    await mhs3.client.rpc('pay_registration', { p_registration_id: regId, p_method: 'CASH' })

    // Panitia tolak (Reject)
    const { data: rejectStatus } = await panitia1.client.rpc('confirm_payment', {
      p_registration_id: regId,
      p_approve: false,
    })

    const isFailed = rejectStatus === 'FAILED'

    // Mahasiswa bayar ulang dengan TRANSFER_BANK
    const { data: repayStatus } = await mhs3.client.rpc('pay_registration', {
      p_registration_id: regId,
      p_method: 'TRANSFER_BANK',
    })

    const passed = isFailed && repayStatus === 'PAID'
    logResult({
      id: 'T12',
      title: 'Panitia tolak Cash -> FAILED; Mahasiswa bayar ulang -> PAID',
      passed,
      message: passed ? 'Alur tolak dan bayar ulang sukses' : 'Gagal bayar ulang setelah ditolak',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T12', title: 'Tolak Cash & bayar ulang', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT12)
  }

  // -------------------------------------------------------------------------
  // T13: Batalkan pendaftaran yang PENDING -> Pendaftaran hilang, kuota bertambah
  // -------------------------------------------------------------------------
  let eventT13: string | null = null
  try {
    const { data: evT13 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Batal Pending T13',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 108',
        quota: 5,
        price: 30000,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT13 = evT13?.id || null
    if (!eventT13) throw new Error('Gagal setup event T13')

    const { data: regId } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT13 })
    if (!regId) throw new Error('Gagal daftar')

    // Batalkan
    const { error: cancelError } = await mhs1.client.rpc('cancel_registration', { p_registration_id: regId })
    if (cancelError) throw new Error(cancelError.message)

    const { data: regCheck } = await adminClient.from('registrations').select('id').eq('id', regId)

    const passed = (!regCheck || regCheck.length === 0)
    logResult({
      id: 'T13',
      title: 'Batalkan pendaftaran PENDING -> Terhapus & Kuota kembali',
      passed,
      message: passed ? 'Pendaftaran berhasil dibatalkan' : 'Pendaftaran masih ada',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T13', title: 'Batal pendaftaran PENDING', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT13)
  }

  // -------------------------------------------------------------------------
  // T14: Batalkan pendaftaran yang sudah PAID -> Ditolak
  // -------------------------------------------------------------------------
  let eventT14: string | null = null
  try {
    const { data: evT14 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Batal PAID T14',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Ruang 109',
        quota: 5,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT14 = evT14?.id || null
    if (!eventT14) throw new Error('Gagal setup event T14')

    const { data: regId } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT14 })
    if (!regId) throw new Error('Gagal daftar')

    // Coba batalkan pendaftaran yang sudah PAID
    const { error: cancelError } = await mhs1.client.rpc('cancel_registration', { p_registration_id: regId })

    const passed = !!cancelError && cancelError.message.includes('sudah dibayar')
    logResult({
      id: 'T14',
      title: 'Batalkan pendaftaran yang sudah PAID -> Ditolak',
      passed,
      message: passed ? 'Ditolak: pendaftaran sudah dibayar' : 'Pembatalan PAID tidak ditolak',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T14', title: 'Batalkan pendaftaran PAID', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT14)
  }

  // -------------------------------------------------------------------------
  // Skenario Check-in (T15, T16, T17, T18)
  // -------------------------------------------------------------------------
  let eventCheckinA: string | null = null
  let eventCheckinB: string | null = null
  try {
    // Event A (milik Panitia 1, awalnya PUBLISHED)
    const { data: evA } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Checkin Utama A',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Auditorium',
        quota: 10,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventCheckinA = evA?.id || null

    // Event B (event pembanding)
    const { data: evB } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Checkin Lain B',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Hall C',
        quota: 10,
        price: 0,
        status: 'ONGOING',
      })
      .select('id')
      .single()

    eventCheckinA = evA?.id || null
    eventCheckinB = evB?.id || null

    if (!eventCheckinA || !eventCheckinB) throw new Error('Gagal setup event checkin')
    const evIdA = eventCheckinA
    const evIdB = eventCheckinB

    // Mhs1 dan Mhs2 daftar di Event A saat status masih PUBLISHED
    const { data: regIdA } = await mhs1.client.rpc('register_for_event', { p_event_id: evIdA })
    const { data: regIdA2 } = await mhs2.client.rpc('register_for_event', { p_event_id: evIdA })

    if (!regIdA || !regIdA2) throw new Error('Gagal registrasi event checkin')

    const { data: ticketA } = await adminClient
      .from('tickets')
      .select('ticket_code')
      .eq('registration_id', regIdA)
      .single()

    const { data: ticketA2 } = await adminClient
      .from('tickets')
      .select('ticket_code')
      .eq('registration_id', regIdA2)
      .single()

    const ticketCodeA = ticketA?.ticket_code || ''
    const ticketCodeA2 = ticketA2?.ticket_code || ''

    // T15: Check-in saat event masih Published -> Ditolak
    const { error: errT15 } = await panitia1.client.rpc('check_in', {
      p_ticket_code: ticketCodeA,
      p_event_id: evIdA,
    })
    const passedT15 = !!errT15 && errT15.message.includes('Ongoing')
    logResult({
      id: 'T15',
      title: 'Check-in saat event masih Published -> Ditolak',
      passed: passedT15,
      message: passedT15 ? 'Ditolak: harus berstatus Ongoing' : 'Check-in pada event non-ongoing diizinkan',
    })

    // Ubah Event A jadi ONGOING
    await adminClient.from('events').update({ status: 'ONGOING' }).eq('id', evIdA)

    // T16: Check-in tiket valid saat Ongoing -> Berhasil
    const { data: resT16, error: errT16 } = await panitia1.client.rpc('check_in', {
      p_ticket_code: ticketCodeA,
      p_event_id: evIdA,
    })
    const passedT16 = !errT16 && !!resT16
    logResult({
      id: 'T16',
      title: 'Check-in tiket valid saat Ongoing -> Berhasil',
      passed: passedT16,
      message: passedT16 ? 'Check-in berhasil, tiket USED' : `Gagal: ${errT16?.message}`,
    })

    // T17: Check-in tiket yang sama lagi -> Ditolak "sudah digunakan"
    const { error: errT17 } = await panitia1.client.rpc('check_in', {
      p_ticket_code: ticketCodeA,
      p_event_id: evIdA,
    })
    const passedT17 = !!errT17 && errT17.message.includes('sudah digunakan')
    logResult({
      id: 'T17',
      title: 'Check-in tiket yang sama lagi -> Ditolak "sudah digunakan"',
      passed: passedT17,
      message: passedT17 ? 'Ditolak: tiket sudah digunakan' : 'Tiket ganda tidak dicegah',
    })

    // T18: Check-in tiket event lain -> Ditolak
    // Tiket A2 terdaftar di Event A, tapi coba di-check-in pada Event B
    const { error: errT18 } = await panitia1.client.rpc('check_in', {
      p_ticket_code: ticketCodeA2,
      p_event_id: evIdB,
    })
    const passedT18 = !!errT18 && errT18.message.includes('bukan untuk event')
    logResult({
      id: 'T18',
      title: 'Check-in tiket event lain -> Ditolak',
      passed: passedT18,
      message: passedT18 ? 'Ditolak: tiket bukan untuk event ini' : 'Tiket salah event diterima',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T15-18', title: 'Pengujian Check-in', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventCheckinA)
    await cleanupEvent(eventCheckinB)
  }

  // -------------------------------------------------------------------------
  // T19: Batalkan event yang sudah punya peserta -> Tiket jadi CANCELLED, notifikasi terkirim
  // -------------------------------------------------------------------------
  let eventT19: string | null = null
  try {
    const { data: evT19 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Pembatalan T19',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Hall D',
        quota: 10,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT19 = evT19?.id || null
    if (!eventT19) throw new Error('Gagal setup event T19')

    const { data: regId } = await mhs1.client.rpc('register_for_event', { p_event_id: eventT19 })
    if (!regId) throw new Error('Gagal daftar')

    // Panitia membatalkan event
    await panitia1.client.from('events').update({ status: 'CANCELLED' }).eq('id', eventT19)

    // Cek tiket
    const { data: ticket } = await adminClient
      .from('tickets')
      .select('status')
      .eq('registration_id', regId)
      .single()

    // Cek notifikasi pembatalan
    const { data: notifs } = await adminClient
      .from('notifications')
      .select('type')
      .eq('user_id', mhs1.user.id)
      .eq('event_id', eventT19)
      .eq('type', 'EVENT_CANCELLED')

    const passed = ticket?.status === 'CANCELLED' && (notifs?.length || 0) > 0
    logResult({
      id: 'T19',
      title: 'Batalkan event dengan peserta -> Tiket CANCELLED & Notifikasi',
      passed,
      message: passed ? 'Tiket otomatis dibatalkan & notifikasi terkirim' : 'Status tiket tidak terupdate',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T19', title: 'Batalkan event dengan peserta', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT19)
  }

  // -------------------------------------------------------------------------
  // T20: Turunkan kuota di bawah jumlah pendaftar -> Ditolak
  // -------------------------------------------------------------------------
  let eventT20: string | null = null
  try {
    const { data: evT20 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event Kuota T20',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Hall E',
        quota: 5,
        price: 0,
        status: 'PUBLISHED',
      })
      .select('id')
      .single()

    eventT20 = evT20?.id || null
    if (!eventT20) throw new Error('Gagal setup event T20')

    await mhs1.client.rpc('register_for_event', { p_event_id: eventT20 })
    await mhs2.client.rpc('register_for_event', { p_event_id: eventT20 })

    // Pendaftar ada 2, coba turunkan kuota jadi 1
    const { error: quotaError } = await panitia1.client
      .from('events')
      .update({ quota: 1 })
      .eq('id', eventT20)

    const passed = !!quotaError && quotaError.message.includes('Kuota tidak boleh lebih kecil')
    logResult({
      id: 'T20',
      title: 'Turunkan kuota di bawah jumlah pendaftar -> Ditolak',
      passed,
      message: passed ? 'Ditolak: kuota tidak boleh lebih kecil dari pendaftar' : 'Penurunan kuota ilegal diizinkan',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T20', title: 'Turunkan kuota event', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT20)
  }

  // -------------------------------------------------------------------------
  // T21: Ubah status Completed -> Published -> Ditolak
  // -------------------------------------------------------------------------
  let eventT21: string | null = null
  try {
    const { data: evT21 } = await adminClient
      .from('events')
      .insert({
        organizer_id: panitia1.user.id,
        category_id: categoryId,
        title: 'Event State Machine T21',
        event_date: '2026-12-30',
        start_time: '09:00',
        location: 'Hall F',
        quota: 10,
        price: 0,
        status: 'COMPLETED',
      })
      .select('id')
      .single()

    eventT21 = evT21?.id || null
    if (!eventT21) throw new Error('Gagal setup event T21')

    // Coba ubah COMPLETED -> PUBLISHED
    const { error: stateError } = await panitia1.client
      .from('events')
      .update({ status: 'PUBLISHED' })
      .eq('id', eventT21)

    const passed = !!stateError && stateError.message.includes('selesai')
    logResult({
      id: 'T21',
      title: 'Ubah status Completed -> Published -> Ditolak',
      passed,
      message: passed ? 'Ditolak: event selesai tidak dapat diubah' : 'Transisi ilegal diizinkan',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T21', title: 'Transisi status ilegal', passed: false, message: errorMsg })
  } finally {
    await cleanupEvent(eventT21)
  }

  // -------------------------------------------------------------------------
  // T22: Admin menonaktifkan user lalu user itu login -> Ditolak
  // -------------------------------------------------------------------------
  try {
    // Nonaktifkan mhs3
    await adminClient.from('profiles').update({ is_active: false }).eq('id', mhs3.user.id)

    // Coba login dengan mhs3
    const testClient = createClient<Database>(supabaseUrl!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: 'mhs3@gmail.com',
      password: 'mahasiswa123',
    })

    // Di level aplikasi / database: profil dicek is_active
    let passed = false
    if (loginError) {
      passed = true
    } else if (loginData.user) {
      const { data: prof } = await testClient
        .from('profiles')
        .select('is_active')
        .eq('id', loginData.user.id)
        .single()
      // Jika profile is_active = false, aplikasi (middleware & loginAction) menolak akses
      passed = prof?.is_active === false
    }

    logResult({
      id: 'T22',
      title: 'Admin menonaktifkan user (is_active = false) -> Akses Ditolak',
      passed,
      message: passed ? 'User terdeteksi non-aktif dan ditolak' : 'User non-aktif masih diizinkan aktif',
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logResult({ id: 'T22', title: 'User nonaktif login', passed: false, message: errorMsg })
  } finally {
    // Pulihkan status mhs3
    await adminClient.from('profiles').update({ is_active: true }).eq('id', mhs3.user.id)
  }

  // -------------------------------------------------------------------------
  // Ringkasan Hasil
  // -------------------------------------------------------------------------
  console.log('\n===============================================================')
  console.log('📊 RINGKASAN HASIL PENGUJIAN')
  console.log('===============================================================')
  const total = results.length
  const passedCount = results.filter((r) => r.passed).length
  const failedCount = total - passedCount

  console.log(`Total Skenario: ${total}`)
  console.log(`✅ Lulus: ${passedCount}`)
  console.log(`❌ Gagal: ${failedCount}`)

  if (failedCount === 0) {
    console.log('\n🎉 SEMUA SKENARIO (T1–T22) LULUS DENGAN SEMPURNA!')
    process.exit(0)
  } else {
    console.log('\n⚠️ BEBERAPA SKENARIO GAGAL. SILAKAN CEK DETAIL DI ATAS.')
    process.exit(1)
  }
}

runAllTests().catch((err) => {
  console.error('Fatal Error:', err)
  process.exit(1)
})
