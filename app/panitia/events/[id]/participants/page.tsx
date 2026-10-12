import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import { ConfirmPaymentDialog } from '@/components/shared/payments'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  XCircle,
  Mail,
  GraduationCap,
  QrCode,
} from 'lucide-react'

export const instant = false

interface EventParticipantsPageProps {
  params: Promise<{ id: string }>
}

export default async function EventParticipantsPage({ params }: EventParticipantsPageProps) {
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

  const isOrganizerOrAdmin = profile?.role === 'PANITIA' || profile?.role === 'ADMIN'
  if (!isOrganizerOrAdmin) {
    redirect('/dashboard')
  }

  // Ambil detail event
  const { data: event, error: eventError } = await supabase
    .from('events_with_stats')
    .select('*')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // Jika Panitia, pastikan event ini miliknya (D7 Kepemilikan Event)
  if (profile.role === 'PANITIA' && event.organizer_id !== user.id) {
    redirect('/panitia/events')
  }

  // Ambil daftar peserta (registrations berelasi dengan profiles, payments, dan tickets/checkins)
  const { data: rawParticipants } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      student:profiles (
        id,
        full_name,
        nim,
        email
      ),
      payment:payments (
        id,
        amount,
        method,
        status,
        paid_at
      ),
      ticket:tickets (
        id,
        ticket_code,
        status,
        checkins (
          id,
          checked_in_at
        )
      )
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  interface ParticipantItem {
    id: string
    created_at: string
    student: {
      id: string
      full_name: string
      nim: string | null
      email: string
    } | null
    payment: {
      id: string
      amount: number
      method: string | null
      status: 'PENDING' | 'PAID' | 'FAILED'
      paid_at: string | null
    } | null
    ticket: {
      id: string
      ticket_code: string
      status: string
      checkins:
        | {
            id: string
            checked_in_at: string
          }[]
        | {
            id: string
            checked_in_at: string
          }
        | null
    } | null
  }

  const participants = (rawParticipants || []) as unknown as ParticipantItem[]

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>PAID</span>
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            <span>FAILED</span>
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock3 className="h-3 w-3" />
            <span>PENDING</span>
          </span>
        )
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={profile.role === 'ADMIN' ? '/admin/events' : '/panitia/events'}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Event</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/panitia/events/${id}/checkin`}>
              <Button size="sm" className="gap-1.5 text-xs h-9 font-semibold">
                <QrCode className="h-4 w-4" />
                <span>Buka Meja Check-in</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ringkasan Header Event */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline">{event.category_name}</Badge>
              <Badge
                variant={
                  event.status === 'PUBLISHED'
                    ? 'success'
                    : event.status === 'ONGOING'
                    ? 'info'
                    : 'secondary'
                }
              >
                {event.status}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-extrabold mt-2">{event.title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {formatDate(event.event_date || '')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {formatTime(event.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {event.location}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="border-t pt-4">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 text-center">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Kapasitas Kuota</div>
                <div className="text-xl font-bold mt-0.5">{event.quota}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Total Pendaftar</div>
                <div className="text-xl font-bold text-primary mt-0.5">
                  {event.registered_count ?? participants.length}
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Sisa Kuota</div>
                <div className="text-xl font-bold mt-0.5">{event.remaining_quota}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Biaya Partisipasi</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {event.price === 0 ? 'Gratis' : formatCurrency(event.price || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabel Peserta */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Daftar Mahasiswa Terdaftar</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {participants.length} peserta tercatat
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {participants.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-base font-semibold">Belum Ada Peserta</div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Belum ada mahasiswa yang mendaftar ke kegiatan ini. Pendaftaran akan otomatis muncul di sini setelah mahasiswa mendaftar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-y text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">No</th>
                      <th className="px-4 py-3 font-semibold">Mahasiswa</th>
                      <th className="px-4 py-3 font-semibold">NIM</th>
                      <th className="px-4 py-3 font-semibold">Status Bayar</th>
                      <th className="px-4 py-3 font-semibold">Presensi</th>
                      <th className="px-4 py-3 font-semibold">Metode</th>
                      <th className="px-4 py-3 font-semibold">Tanggal Daftar</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {participants.map((item, idx) => {
                      const isPendingCash =
                        item.payment?.status === 'PENDING' && item.payment?.method === 'CASH'
                      const isPaid = item.payment?.status === 'PAID'
                      const isFailed = item.payment?.status === 'FAILED'
                      const checkinItem = Array.isArray(item.ticket?.checkins)
                        ? item.ticket?.checkins[0]
                        : item.ticket?.checkins
                      const isCheckedIn = Boolean(checkinItem)

                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-medium">
                            <div className="font-semibold text-foreground">
                              {item.student?.full_name || 'Tidak diketahui'}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{item.student?.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs">
                            {item.student?.nim ? (
                              <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
                                <GraduationCap className="h-3 w-3 text-primary" />
                                <span>{item.student.nim}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">{getPaymentBadge(item.payment?.status)}</td>
                          <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Hadir</span>
                              </span>
                            ) : isPaid ? (
                              <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                <Clock3 className="h-3 w-3" />
                                <span>Belum Hadir</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {item.payment?.method || (event.price === 0 ? 'Gratis' : '-')}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-right whitespace-nowrap">
                            {isPendingCash ? (
                              <div className="flex justify-end">
                                <ConfirmPaymentDialog
                                  registrationId={item.id}
                                  studentName={item.student?.full_name || 'Mahasiswa'}
                                  eventTitle={event.title || 'Event'}
                                  amount={item.payment?.amount ?? event.price ?? 0}
                                />
                              </div>
                            ) : isPaid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Tiket Terbit</span>
                              </span>
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Ditolak</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
      </main>
    </div>
  )
}
