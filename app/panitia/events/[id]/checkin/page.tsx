import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { CheckInScannerForm } from '@/components/shared/checkin'
import { EventStatusBadge } from '@/components/shared/events'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Clock3,
  Ticket,
  Mail,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Tag,
  AlertCircle,
} from 'lucide-react'

export const instant = false

interface PanitiaCheckInPageProps {
  params: Promise<{ id: string }>
}

interface CheckedInItem {
  id: string
  checked_in_at: string
  ticket: {
    id: string
    ticket_code: string
    status: string
    registration: {
      id: string
      student: {
        id: string
        full_name: string
        nim: string | null
        email: string
      } | null
    } | null
  } | null
}

export default async function PanitiaCheckInPage({ params }: PanitiaCheckInPageProps) {
  await connection()
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isStaff = profile?.role === 'PANITIA' || profile?.role === 'ADMIN'
  if (!isStaff) {
    redirect('/dashboard')
  }

  // Ambil detail event dengan statistik sisa kuota dll
  const { data: event, error: eventError } = await supabase
    .from('events_with_stats')
    .select('*')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // Jika Panitia, pastikan event ini miliknya (D7)
  if (profile.role === 'PANITIA' && event.organizer_id !== user.id) {
    redirect('/panitia/events')
  }

  // Ambil data check-in event ini
  const { data: rawCheckins } = await supabase
    .from('checkins')
    .select(`
      id,
      checked_in_at,
      ticket:tickets!inner (
        id,
        ticket_code,
        status,
        registration:registrations!inner (
          id,
          event_id,
          student:profiles!inner (
            id,
            full_name,
            nim,
            email
          )
        )
      )
    `)
    .eq('ticket.registration.event_id', id)
    .order('checked_in_at', { ascending: false })

  const checkins = (rawCheckins || []) as unknown as CheckedInItem[]

  // Hitung total tiket sah yang diterbitkan (ACTIVE atau USED) - tidak termasuk CANCELLED (B2)
  const { count: totalTicketsCount } = await supabase
    .from('tickets')
    .select('id, registration:registrations!inner(event_id)', { count: 'exact', head: true })
    .eq('registration.event_id', id)
    .in('status', ['ACTIVE', 'USED'])

  const totalTickets = totalTicketsCount ?? 0
  const checkedInCount = checkins.length
  const notCheckedInCount = Math.max(0, totalTickets - checkedInCount)
  const attendanceRate = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0

  const formatCheckInTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp)
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(d) + ' WIB'
    } catch {
      return timestamp
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile.full_name,
          role: profile.role,
          email: user.email || '',
        }}
      />

      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
        {/* Navigasi Balik & Judul */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/panitia/events"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Event Saya</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-semibold text-foreground">Meja Presensi Check-in</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/panitia/events/${id}/participants`}>
              <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
                <Users className="h-4 w-4" />
                <span>Daftar Peserta</span>
              </Button>
            </Link>
            <Link href={`/panitia/events/${id}/edit`}>
              <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
                <span>Kelola Status</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ringkasan Header Event */}
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{event.category_name}</span>
                </Badge>
                <EventStatusBadge status={event.status} />
              </div>

              {event.status === 'ONGOING' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Sesi Presensi Aktif</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Event Belum / Selesai Ongoing</span>
                </span>
              )}
            </div>

            <CardTitle className="text-2xl font-black tracking-tight mt-2">
              {event.title}
            </CardTitle>

            <CardDescription className="flex flex-wrap items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{formatDate(event.event_date || '')}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{formatTime(event.start_time)}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{event.location}</span>
              </span>
            </CardDescription>
          </CardHeader>

          {/* Kartu Metrik Kehadiran */}
          <CardContent className="border-t pt-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Tiket Terbit</span>
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-black tracking-tight mt-1">{totalTickets}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Peserta berhak hadir</div>
              </div>

              <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  <span>Sudah Hadir</span>
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight mt-1">
                  {checkedInCount}
                </div>
                <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  Telah check-in di lokasi
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Belum Hadir</span>
                  <Clock3 className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black tracking-tight mt-1">{notCheckedInCount}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Menunggu kedatangan</div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Presensi Kehadiran</span>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-1">
                  {attendanceRate}%
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Dari total tiket terbit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Utama: Form Scanner Presensi di Kiri, Live Feed di Kanan */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Kolom Kiri: Form Scanner Presensi */}
          <div className="lg:col-span-5 space-y-4">
            <CheckInScannerForm
              eventId={event.id || id}
              eventTitle={event.title || 'Kegiatan Kampus'}
              eventStatus={event.status || 'DRAFT'}
            />

            {/* Petunjuk Panitia Box */}
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 text-xs text-muted-foreground space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Aturan Validasi Check-in (BR-07 & D8)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 leading-relaxed">
                <li>Check-in hanya diterima jika status event saat ini adalah <strong>ONGOING</strong>.</li>
                <li>Kode tiket bersifat unik (contoh: <code>CE-XXXXXXXXXX</code>) dan case-insensitive.</li>
                <li>Satu tiket hanya dapat digunakan 1 kali check-in (status tiket berubah menjadi <strong>USED</strong>).</li>
                <li>Hanya pendaftaran yang berstatus <strong>PAID</strong> yang dapat melakukan check-in.</li>
              </ul>
            </div>
          </div>

          {/* Kolom Kanan: Live Feed Riwayat Kehadiran */}
          <div className="lg:col-span-7">
            <Card className="border shadow-xs bg-card">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Riwayat Kehadiran Peserta</CardTitle>
                      <CardDescription className="text-xs">
                        Daftar mahasiswa yang telah berhasil melakukan verifikasi check-in
                      </CardDescription>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {checkins.length} Hadir
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {checkins.length === 0 ? (
                  <div className="text-center py-14 px-4 space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Ticket className="h-6 w-6" />
                    </div>
                    <div className="text-base font-semibold">Belum Ada Peserta yang Check-in</div>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Belum ada tiket yang divalidasi. Masukkan kode tiket peserta melalui form di sebelah kiri untuk mencatat presensi kehadiran.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase">
                        <tr>
                          <th className="px-4 py-3 font-semibold">No</th>
                          <th className="px-4 py-3 font-semibold">Mahasiswa</th>
                          <th className="px-4 py-3 font-semibold">NIM</th>
                          <th className="px-4 py-3 font-semibold">Kode Tiket</th>
                          <th className="px-4 py-3 font-semibold text-right">Waktu Hadir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {checkins.map((item, idx) => {
                          const student = item.ticket?.registration?.student

                          return (
                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3.5 text-xs text-muted-foreground">{idx + 1}</td>
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-foreground">
                                  {student?.full_name || 'Mahasiswa'}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{student?.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-xs">
                                {student?.nim ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
                                    <GraduationCap className="h-3 w-3 text-primary" />
                                    <span>{student.nim}</span>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-xs font-mono font-bold text-primary">
                                {item.ticket?.ticket_code || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{formatCheckInTime(item.checked_in_at)}</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
