import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { generateCsv } from '@/lib/utils/csv'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

  if (!profile || !profile.is_active || (profile.role !== 'PANITIA' && profile.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  // Ambil detail event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
  }

  // Jika role PANITIA, pastikan event ini miliknya (D7 Kepemilikan Event)
  if (profile.role === 'PANITIA' && event.organizer_id !== user.id) {
    return NextResponse.json(
      { error: 'Akses ditolak: Anda hanya dapat mengunduh data event milik Anda sendiri' },
      { status: 403 }
    )
  }

  // Ambil daftar peserta
  const { data: rawParticipants, error: participantsError } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      student:profiles (
        full_name,
        nim,
        email
      ),
      payment:payments (
        amount,
        method,
        status,
        paid_at
      ),
      ticket:tickets (
        ticket_code,
        status,
        checkins (
          checked_in_at
        )
      )
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  if (participantsError) {
    return NextResponse.json(
      { error: 'Gagal memuat data peserta: ' + participantsError.message },
      { status: 500 }
    )
  }

  const headers = [
    'No',
    'Nama Peserta',
    'NIM',
    'Email',
    'Status Pembayaran',
    'Metode Pembayaran',
    'Nominal (Rp)',
    'Kode Tiket',
    'Status Tiket',
    'Status Kehadiran',
    'Waktu Check-in (WIB)',
    'Waktu Pendaftaran (WIB)',
  ]

  const formatWib = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  type RawParticipantRow = {
    id: string
    created_at: string
    student: { full_name: string; nim: string | null; email: string } | null
    payment: { amount: number; method: string | null; status: string; paid_at: string | null } | null
    ticket: {
      ticket_code: string
      status: string
      checkins: { checked_in_at: string } | { checked_in_at: string }[] | null
    } | null
  }

  const rows = ((rawParticipants as unknown as RawParticipantRow[]) || []).map((p, index) => {
    const checkinData = Array.isArray(p.ticket?.checkins)
      ? p.ticket?.checkins[0]
      : p.ticket?.checkins
    const isCheckedIn = Boolean(checkinData)

    return [
      index + 1,
      p.student?.full_name || '-',
      p.student?.nim || '-',
      p.student?.email || '-',
      p.payment?.status || 'PENDING',
      p.payment?.method || '-',
      p.payment?.amount ?? 0,
      p.ticket?.ticket_code || '-',
      p.ticket?.status || '-',
      isCheckedIn ? 'Hadir' : 'Belum Hadir',
      isCheckedIn ? formatWib(checkinData?.checked_in_at) : '-',
      formatWib(p.created_at),
    ]
  })

  const csvString = generateCsv(headers, rows)

  const cleanSlug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  const todayStr = new Date().toISOString().slice(0, 10)
  const filename = `peserta-${cleanSlug}-${todayStr}.csv`

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
