import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCsv } from '@/lib/utils/csv'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active || profile.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak: Hanya Administrator yang dapat mengunduh laporan global' }, { status: 403 })
  }

  // Ambil semua event kampus beserta statistik dasar
  const { data: events, error: eventsError } = await supabase
    .from('events_with_stats')
    .select('*')
    .order('event_date', { ascending: false })

  if (eventsError) {
    return NextResponse.json(
      { error: 'Gagal memuat rekap event: ' + eventsError.message },
      { status: 500 }
    )
  }

  const eventIds = (events || []).map((e) => e.id).filter((id): id is string => Boolean(id))

  // Ambil checkins dan payments untuk agregasi event-event ini
  const checkInsMap: Record<string, number> = {}
  const paidRevenueMap: Record<string, number> = {}
  const paidTicketsMap: Record<string, number> = {}

  if (eventIds.length > 0) {
    const { data: registrations } = await supabase
      .from('registrations')
      .select(`
        id,
        event_id,
        payment:payments (
          amount,
          status
        ),
        ticket:tickets (
          status,
          checkins (
            id
          )
        )
      `)
      .in('event_id', eventIds)

    type RegRecord = {
      id: string
      event_id: string
      payment: { amount: number; status: string } | null
      ticket: {
        status: string
        checkins: { id: string } | { id: string }[] | null
      } | null
    }

    const typedRegs = (registrations as unknown as RegRecord[]) || []

    typedRegs.forEach((r) => {
      const eId = r.event_id

      // Hitung Omset Lunas
      if (r.payment && r.payment.status === 'PAID') {
        paidRevenueMap[eId] = (paidRevenueMap[eId] || 0) + (r.payment.amount || 0)
        paidTicketsMap[eId] = (paidTicketsMap[eId] || 0) + 1
      }

      // Hitung Check-in
      const hasCheckin = Array.isArray(r.ticket?.checkins)
        ? r.ticket?.checkins.length > 0
        : Boolean(r.ticket?.checkins)
      if (hasCheckin) {
        checkInsMap[eId] = (checkInsMap[eId] || 0) + 1
      }
    })
  }

  const headers = [
    'No',
    'Judul Event',
    'Kategori',
    'Penyelenggara',
    'Status Event',
    'Tanggal Event',
    'Harga Tiket (Rp)',
    'Kuota',
    'Total Pendaftar',
    'Tiket Lunas (PAID)',
    'Peserta Hadir',
    'Persentase Hadir (%)',
    'Total Omset (Rp)',
  ]

  const rows = (events || []).map((ev, idx) => {
    const evId = ev.id || ''
    const regCount = ev.registered_count || 0
    const checkedInCount = checkInsMap[evId] || 0
    const paidRevenue = paidRevenueMap[evId] || 0
    const paidTickets = paidTicketsMap[evId] || 0
    const presentRate = regCount > 0 ? Math.round((checkedInCount / regCount) * 100) : 0

    return [
      idx + 1,
      ev.title,
      ev.category_name || '-',
      ev.organizer_name || '-',
      ev.status,
      ev.event_date,
      ev.price || 0,
      ev.quota,
      regCount,
      paidTickets,
      checkedInCount,
      `${presentRate}%`,
      paidRevenue,
    ]
  })

  const csvString = generateCsv(headers, rows)
  const todayStr = new Date().toISOString().slice(0, 10)
  const filename = `laporan-global-kampus-${todayStr}.csv`

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
