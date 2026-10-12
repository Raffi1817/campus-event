import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

// Load .env.local if running in Node
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    // Abaikan jika sudah di-load oleh environment
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib ada di .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function randomTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `CE-${result}`
}

async function getOrCreateUser(email: string, password: string, fullName: string, nim: string | null, role: 'ADMIN' | 'PANITIA' | 'MAHASISWA') {
  // 1. Cek apakah user sudah ada
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    throw new Error(`Gagal membaca list user: ${listError.message}`)
  }

  let user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    // Buat user baru
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        nim: nim || undefined,
      },
    })

    if (createError || !createData.user) {
      throw new Error(`Gagal membuat user ${email}: ${createError?.message}`)
    }
    user = createData.user
  } else {
    // Update password dan metadata jika sudah ada
    await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        nim: nim || undefined,
      },
    })
  }

  // 2. Pastikan tabel profiles sesuai
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: fullName,
      nim: nim,
      email: email,
      role: role,
      is_active: true,
    })

  if (profileError) {
    throw new Error(`Gagal update profil ${email}: ${profileError.message}`)
  }

  return { id: user.id, email, fullName, role }
}

async function main() {
  console.log('🚀 Memulai Seeding Data Kampus (Versi Ringan)...')

  // ==========================================
  // 1. BUAT USERS (1 Admin, 3 Panitia, 10 Mahasiswa)
  // ==========================================
  console.log('\n👤 1. Menyiapkan User & Profil...')
  
  // 1 Admin
  const adminUser = await getOrCreateUser('admin@gmail.com', 'admin123', 'Administrator Kampus', null, 'ADMIN')
  console.log(`   ✅ Admin: ${adminUser.email}`)

  // 3 Panitia
  const panitiaUsers = [
    await getOrCreateUser('panitia1@gmail.com', 'panitia123', 'Budi Santoso (BEM)', null, 'PANITIA'),
    await getOrCreateUser('panitia2@gmail.com', 'panitia123', 'Siti Rahma (HIMATIKA)', null, 'PANITIA'),
    await getOrCreateUser('panitia3@gmail.com', 'panitia123', 'Ahmad Fauzi (UKM Seni)', null, 'PANITIA'),
  ]
  console.log(`   ✅ Panitia: 3 akun (${panitiaUsers.map(p => p.email).join(', ')})`)

  // 10 Mahasiswa
  const mahasiswaData = [
    { email: 'mhs1@gmail.com', name: 'Andi Pratama', nim: '2021001' },
    { email: 'mhs2@gmail.com', name: 'Dewi Lestari', nim: '2021002' },
    { email: 'mhs3@gmail.com', name: 'Rian Hidayat', nim: '2021003' },
    { email: 'mhs4@gmail.com', name: 'Putri Ayu', nim: '2021004' },
    { email: 'mhs5@gmail.com', name: 'Fajar Nugraha', nim: '2021005' },
    { email: 'mhs6@gmail.com', name: 'Nadia Safitri', nim: '2021006' },
    { email: 'mhs7@gmail.com', name: 'Dimas Anggara', nim: '2021007' },
    { email: 'mhs8@gmail.com', name: 'Citra Kirana', nim: '2021008' },
    { email: 'mhs9@gmail.com', name: 'Bagus Wicaksono', nim: '2021009' },
    { email: 'mhs10@gmail.com', name: 'Tia Maharani', nim: '2021010' },
  ]

  const mhsUsers = []
  for (const m of mahasiswaData) {
    const user = await getOrCreateUser(m.email, 'mahasiswa123', m.name, m.nim, 'MAHASISWA')
    mhsUsers.push(user)
  }
  console.log(`   ✅ Mahasiswa: 10 akun (${mhsUsers[0].email} s.d. ${mhsUsers[mhsUsers.length - 1].email})`)

  // ==========================================
  // 2. KATEGORI (8 Kategori)
  // ==========================================
  console.log('\n🏷️  2. Menyiapkan Kategori...')
  const categoriesList = [
    { name: 'Seminar', description: 'Seminar ilmiah, wawasan keilmuan, dan teknologi terkini' },
    { name: 'Workshop', description: 'Praktik langsung, hands-on coding, dan pelatihan teknis' },
    { name: 'Lomba', description: 'Kompetisi akademik, hackathon, dan perlombaan inovasi' },
    { name: 'Pelatihan', description: 'Pelatihan soft skill, kepemimpinan, dan manajemen' },
    { name: 'Organisasi', description: 'Musyawarah besar, pelantikan, dan temu anggota organisasi' },
    { name: 'Olahraga', description: 'Turnamen futsal, basket, bulutangkis, dan e-sports' },
    { name: 'Seni & Budaya', description: 'Pentas seni musik, teater, tari, dan pameran budaya' },
    { name: 'Karier', description: 'Bursa kerja kampus, career expo, dan seminar persiapan kerja' },
  ]

  const catMap = new Map<string, string>()
  for (const cat of categoriesList) {
    const { data: existing } = await supabase.from('categories').select('id, name').eq('name', cat.name).maybeSingle()
    if (existing) {
      catMap.set(cat.name, existing.id)
    } else {
      const { data: inserted, error } = await supabase.from('categories').insert(cat).select('id').single()
      if (error || !inserted) {
        throw new Error(`Gagal insert kategori ${cat.name}: ${error?.message}`)
      }
      catMap.set(cat.name, inserted.id)
    }
  }
  console.log(`   ✅ Kategori: 8 kategori aktif`)

  // ==========================================
  // 3. EVENT (8 Event dengan berbagai status)
  // ==========================================
  console.log('\n📅 3. Menyiapkan Event...')
  const eventsToSeed: Database['public']['Tables']['events']['Insert'][] = [
    {
      title: 'TechFest: National Hackathon 2026',
      organizer_id: panitiaUsers[0].id,
      category_id: catMap.get('Lomba')!,
      description: 'Kompetisi hackathon pengembangan solusi inovatif berbasis AI dan cloud tingkat nasional.',
      event_date: '2026-11-20',
      start_time: '08:00',
      end_time: '17:00',
      location: 'Auditorium Utama Gd. A',
      quota: 50,
      price: 50000,
      poster_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Career Talk: Sukses Menembus Big Tech',
      organizer_id: panitiaUsers[0].id,
      category_id: catMap.get('Karier')!,
      description: 'Sharing session bersama software engineer alumni mengenai persiapan interview dan portfolio.',
      event_date: '2026-11-25',
      start_time: '13:00',
      end_time: '15:30',
      location: 'Zoom Meeting & Gedung Serbaguna',
      quota: 100,
      price: 0,
      poster_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60',
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Workshop UI/UX Design with Figma',
      organizer_id: panitiaUsers[1].id,
      category_id: catMap.get('Workshop')!,
      description: 'Hands-on belajar membuat design system komponen dan prototyping interaktif modern.',
      event_date: new Date().toISOString().split('T')[0], // Hari ini
      start_time: '09:00',
      end_time: '16:00',
      location: 'Lab Komputer 3 Lt. 2',
      quota: 30,
      price: 25000,
      poster_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=60',
      status: 'ONGOING' as const,
    },
    {
      title: 'Turnamen Futsal Antar Jurusan',
      organizer_id: panitiaUsers[1].id,
      category_id: catMap.get('Olahraga')!,
      description: 'Ajang kompetisi persahabatan dan sportivitas mahasiswa antar program studi.',
      event_date: '2026-10-01',
      start_time: '08:00',
      end_time: '18:00',
      location: 'Lapangan Olahraga Kampus',
      quota: 16,
      price: 75000,
      poster_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60',
      status: 'COMPLETED' as const,
    },
    {
      title: 'Seminar Kewirausahaan Muda',
      organizer_id: panitiaUsers[0].id,
      category_id: catMap.get('Seminar')!,
      description: 'Strategi membangun startup dan bisnis mandiri dari bangku kuliah.',
      event_date: '2026-09-15',
      start_time: '09:00',
      end_time: '12:00',
      location: 'Aula Rektorat Lt. 3',
      quota: 80,
      price: 0,
      poster_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=60',
      status: 'COMPLETED' as const,
    },
    {
      title: 'Malam Keakraban Seni & Musik Kampus',
      organizer_id: panitiaUsers[2].id,
      category_id: catMap.get('Seni & Budaya')!,
      description: 'Pentas hiburan kolaborasi musik, tari, dan pertunjukan akustik mahasiswa.',
      event_date: '2026-10-05',
      start_time: '19:00',
      end_time: '22:00',
      location: 'Amfiteater Kampus',
      quota: 50,
      price: 30000,
      poster_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
      status: 'CANCELLED' as const,
    },
    {
      title: 'Pelatihan Public Speaking & Leadership',
      organizer_id: panitiaUsers[2].id,
      category_id: catMap.get('Pelatihan')!,
      description: 'Tips percaya diri berbicara di depan umum dan kepemimpinan organisasi.',
      event_date: '2026-12-01',
      start_time: '10:00',
      end_time: '14:00',
      location: 'Ruang Seminar Gd. B',
      quota: 40,
      price: 20000,
      poster_url: null,
      status: 'DRAFT' as const,
    },
    {
      title: 'Musyawarah Besar Mahasiswa 2026',
      organizer_id: panitiaUsers[2].id,
      category_id: catMap.get('Organisasi')!,
      description: 'Sidang tahunan laporan pertanggungjawaban dan pemilihan kepengurusan baru.',
      event_date: '2026-12-10',
      start_time: '09:00',
      end_time: '15:00',
      location: 'Gedung PKM Lt. 2',
      quota: 60,
      price: 0,
      poster_url: null,
      status: 'DRAFT' as const,
    },
  ]

  const eventMap = new Map<string, { id: string; price: number; status: string; title: string; organizer_id: string }>()

  for (const ev of eventsToSeed) {
    const { data: existing } = await supabase.from('events').select('id, price, status, title, organizer_id').eq('title', ev.title).maybeSingle()
    if (existing) {
      eventMap.set(ev.title, existing)
    } else {
      const { data: inserted, error } = await supabase.from('events').insert(ev).select('id, price, status, title, organizer_id').single()
      if (error || !inserted) {
        throw new Error(`Gagal insert event ${ev.title}: ${error?.message}`)
      }
      eventMap.set(ev.title, inserted)
    }
  }
  console.log(`   ✅ Event: 8 event berhasil disiapkan`)

  // ==========================================
  // 4. REGISTRASI, PEMBAYARAN, TIKET, CHECKIN
  // ==========================================
  console.log('\n🎟️  4. Menyiapkan Registrasi, Pembayaran, Tiket & Check-in...')

  // Kita buat skenario terarah untuk mahasiswa:
  // Event 1: TechFest Hackathon (PUBLISHED, Bayar 50k)
  //   - mhs1: PAID (E_WALLET) -> Tiket ACTIVE
  //   - mhs2: PAID (TRANSFER_BANK) -> Tiket ACTIVE
  //   - mhs3: PENDING (CASH)
  //   - mhs4: FAILED (CASH)
  // Event 2: Career Talk (PUBLISHED, Gratis)
  //   - mhs1, mhs5, mhs6, mhs7: Langsung PAID (Gratis) -> Tiket ACTIVE
  // Event 3: Workshop UI/UX (ONGOING, Bayar 25k)
  //   - mhs2: PAID (E_WALLET) -> Tiket USED (Sudah Check-in!)
  //   - mhs3: PAID (TRANSFER_BANK) -> Tiket ACTIVE (Belum Hadir)
  //   - mhs8: PAID (E_WALLET) -> Tiket USED (Sudah Check-in!)
  // Event 4: Turnamen Futsal (COMPLETED, Bayar 75k)
  //   - mhs4, mhs5, mhs9: PAID -> Tiket USED (Sudah Selesai)
  // Event 5: Seminar Kewirausahaan (COMPLETED, Gratis)
  //   - mhs6, mhs7, mhs10: PAID (Gratis) -> Tiket USED (Sudah Selesai)
  // Event 6: Malam Keakraban (CANCELLED, Bayar 30k)
  //   - mhs8, mhs10: PAID -> Tiket CANCELLED (Event Dibatalkan)

  type RegistrationPlan = {
    mhsIndex: number
    eventTitle: string
    paymentStatus: 'PAID' | 'PENDING' | 'FAILED'
    method: 'E_WALLET' | 'TRANSFER_BANK' | 'CASH' | null
    ticketStatus: 'ACTIVE' | 'USED' | 'CANCELLED' | null
    isCheckedIn: boolean
  }

  const regPlans: RegistrationPlan[] = [
    // Event 1 (Hackathon - Published, berbayar)
    { mhsIndex: 0, eventTitle: 'TechFest: National Hackathon 2026', paymentStatus: 'PAID', method: 'E_WALLET', ticketStatus: 'ACTIVE', isCheckedIn: false },
    { mhsIndex: 1, eventTitle: 'TechFest: National Hackathon 2026', paymentStatus: 'PAID', method: 'TRANSFER_BANK', ticketStatus: 'ACTIVE', isCheckedIn: false },
    { mhsIndex: 2, eventTitle: 'TechFest: National Hackathon 2026', paymentStatus: 'PENDING', method: 'CASH', ticketStatus: null, isCheckedIn: false },
    { mhsIndex: 3, eventTitle: 'TechFest: National Hackathon 2026', paymentStatus: 'FAILED', method: 'CASH', ticketStatus: null, isCheckedIn: false },

    // Event 2 (Career Talk - Published, gratis)
    { mhsIndex: 0, eventTitle: 'Career Talk: Sukses Menembus Big Tech', paymentStatus: 'PAID', method: null, ticketStatus: 'ACTIVE', isCheckedIn: false },
    { mhsIndex: 4, eventTitle: 'Career Talk: Sukses Menembus Big Tech', paymentStatus: 'PAID', method: null, ticketStatus: 'ACTIVE', isCheckedIn: false },
    { mhsIndex: 5, eventTitle: 'Career Talk: Sukses Menembus Big Tech', paymentStatus: 'PAID', method: null, ticketStatus: 'ACTIVE', isCheckedIn: false },
    { mhsIndex: 6, eventTitle: 'Career Talk: Sukses Menembus Big Tech', paymentStatus: 'PAID', method: null, ticketStatus: 'ACTIVE', isCheckedIn: false },

    // Event 3 (Workshop UI/UX - Ongoing, berbayar)
    { mhsIndex: 1, eventTitle: 'Workshop UI/UX Design with Figma', paymentStatus: 'PAID', method: 'E_WALLET', ticketStatus: 'USED', isCheckedIn: true },
    { mhsIndex: 2, eventTitle: 'Workshop UI/UX Design with Figma', paymentStatus: 'PAID', method: 'TRANSFER_BANK', ticketStatus: 'ACTIVE', isCheckedIn: false },
    { mhsIndex: 7, eventTitle: 'Workshop UI/UX Design with Figma', paymentStatus: 'PAID', method: 'E_WALLET', ticketStatus: 'USED', isCheckedIn: true },

    // Event 4 (Turnamen Futsal - Completed, berbayar)
    { mhsIndex: 3, eventTitle: 'Turnamen Futsal Antar Jurusan', paymentStatus: 'PAID', method: 'TRANSFER_BANK', ticketStatus: 'USED', isCheckedIn: true },
    { mhsIndex: 4, eventTitle: 'Turnamen Futsal Antar Jurusan', paymentStatus: 'PAID', method: 'E_WALLET', ticketStatus: 'USED', isCheckedIn: true },
    { mhsIndex: 8, eventTitle: 'Turnamen Futsal Antar Jurusan', paymentStatus: 'PAID', method: 'E_WALLET', ticketStatus: 'USED', isCheckedIn: true },

    // Event 5 (Seminar Kewirausahaan - Completed, gratis)
    { mhsIndex: 5, eventTitle: 'Seminar Kewirausahaan Muda', paymentStatus: 'PAID', method: null, ticketStatus: 'USED', isCheckedIn: true },
    { mhsIndex: 6, eventTitle: 'Seminar Kewirausahaan Muda', paymentStatus: 'PAID', method: null, ticketStatus: 'USED', isCheckedIn: true },
    { mhsIndex: 9, eventTitle: 'Seminar Kewirausahaan Muda', paymentStatus: 'PAID', method: null, ticketStatus: 'USED', isCheckedIn: true },

    // Event 6 (Malam Keakraban - Cancelled, berbayar)
    { mhsIndex: 7, eventTitle: 'Malam Keakraban Seni & Musik Kampus', paymentStatus: 'PAID', method: 'E_WALLET', ticketStatus: 'CANCELLED', isCheckedIn: false },
    { mhsIndex: 9, eventTitle: 'Malam Keakraban Seni & Musik Kampus', paymentStatus: 'PAID', method: 'TRANSFER_BANK', ticketStatus: 'CANCELLED', isCheckedIn: false },
  ]

  let regCount = 0
  let payCount = 0
  let ticketCount = 0
  let checkinCount = 0
  let notifCount = 0

  for (const plan of regPlans) {
    const user = mhsUsers[plan.mhsIndex]
    const event = eventMap.get(plan.eventTitle)!

    // 1. Registrasi
    let { data: reg } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .maybeSingle()

    if (!reg) {
      const { data: insertedReg, error: regErr } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          event_id: event.id,
        })
        .select('id')
        .single()

      if (regErr || !insertedReg) {
        console.error(`Gagal daftar ${user.email} di ${event.title}:`, regErr?.message)
        continue
      }
      reg = insertedReg
      regCount++
    }

    // 2. Pembayaran
    const { data: existingPay } = await supabase.from('payments').select('id').eq('registration_id', reg.id).maybeSingle()
    if (!existingPay) {
      const isPaid = plan.paymentStatus === 'PAID'
      const { error: payErr } = await supabase.from('payments').insert({
        registration_id: reg.id,
        amount: event.price,
        method: plan.method,
        status: plan.paymentStatus,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      if (!payErr) payCount++
    }

    // 3. Tiket
    if (plan.ticketStatus) {
      let { data: ticket } = await supabase.from('tickets').select('id').eq('registration_id', reg.id).maybeSingle()
      if (!ticket) {
        const { data: insertedTicket, error: ticketErr } = await supabase
          .from('tickets')
          .insert({
            registration_id: reg.id,
            ticket_code: randomTicketCode(),
            status: plan.ticketStatus,
          })
          .select('id')
          .single()

        if (!ticketErr && insertedTicket) {
          ticket = insertedTicket
          ticketCount++
        }
      }

      // 4. Check-in
      if (ticket && plan.isCheckedIn) {
        const { data: existingCheckin } = await supabase.from('checkins').select('id').eq('ticket_id', ticket.id).maybeSingle()
        if (!existingCheckin) {
          const { error: checkinErr } = await supabase.from('checkins').insert({
            ticket_id: ticket.id,
            checked_in_by: event.organizer_id,
          })
          if (!checkinErr) checkinCount++
        }
      }
    }

    // 5. Notifikasi contoh
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'REGISTRATION',
      title: 'Pendaftaran Berhasil',
      message: `Pendaftaran Anda untuk event "${event.title}" telah tercatat.`,
      event_id: event.id,
      is_read: false,
    })
    if (!notifErr) notifCount++
  }

  console.log(`   ✅ Registrasi dibuat/tersedia (${regCount} baru)`)
  console.log(`   ✅ Pembayaran dibuat/tersedia (${payCount} baru)`)
  console.log(`   ✅ Tiket dibuat/tersedia (${ticketCount} baru)`)
  console.log(`   ✅ Check-in kehadiran dibuat/tersedia (${checkinCount} baru)`)
  console.log(`   ✅ Notifikasi dibuat/tersedia (${notifCount} baru)`)

  console.log('\n==========================================')
  console.log('🎉 SEED DATA SELESAI!')
  console.log('==========================================')
  console.log('Kredensial Login Demo:')
  console.log('• Admin: admin@gmail.com / admin123')
  console.log('• Panitia (1-3): panitia1@gmail.com / panitia123 (s.d. panitia3)')
  console.log('• Mahasiswa (1-10): mhs1@gmail.com / mahasiswa123 (s.d. mhs10)')
  console.log('==========================================\n')
}

main().catch((err) => {
  console.error('\n❌ Terjadi error saat seeding:', err)
  process.exit(1)
})
