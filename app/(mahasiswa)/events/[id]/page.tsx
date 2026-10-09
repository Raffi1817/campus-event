import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  Ticket,
  AlertCircle,
} from 'lucide-react'

export const instant = false

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
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

  // Ambil detail event dengan sisa kuota dan kategori dari view events_with_stats
  const { data: event, error } = await supabase
    .from('events_with_stats')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  const isRegistrationOpen = event.status === 'PUBLISHED'
  const isFull = (event.remaining_quota ?? 0) <= 0
  const isStudent = profile?.role === 'MAHASISWA'

  const getStatusBadge = () => {
    switch (event.status) {
      case 'PUBLISHED':
        return <Badge variant="success">Pendaftaran Dibuka</Badge>
      case 'ONGOING':
        return <Badge variant="info">Sedang Berlangsung</Badge>
      case 'COMPLETED':
        return <Badge variant="muted">Selesai</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{event.status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile?.full_name || 'Pengguna',
          role: profile?.role || 'MAHASISWA',
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Katalog Event</span>
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Kolom Kiri: Poster & Deskripsi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-indigo-500/20 via-primary/10 to-purple-500/20 flex items-center justify-center overflow-hidden">
                {event.poster_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={event.poster_url}
                    alt={event.title || 'Poster Event'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center p-6">
                    <Ticket className="h-16 w-16 text-primary/40 mb-2" />
                    <span className="text-sm font-semibold text-primary/80 uppercase tracking-widest">
                      {event.category_name || 'Campus Event'}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge()}
                  <Badge variant="outline">{event.category_name}</Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {event.title}
                </h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>
                    Diselenggarakan oleh <strong>{event.organizer_name}</strong>
                  </span>
                </div>

                <hr />

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Deskripsi Event</h2>
                  <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {event.description || 'Tidak ada deskripsi rinci untuk event ini.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Rincian Jadwal & Kotak Pendaftaran */}
          <div className="space-y-6">
            <Card className="sticky top-20 shadow-md">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                    Biaya Partisipasi
                  </div>
                  <div className="text-3xl font-extrabold text-primary mt-1">
                    {event.price === 0 ? 'Gratis' : formatCurrency(event.price || 0)}
                  </div>
                </div>

                <hr />

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Tanggal Pelaksanaan</div>
                      <div className="text-muted-foreground">{formatDate(event.event_date || '')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Waktu</div>
                      <div className="text-muted-foreground">
                        {formatTime(event.start_time)}
                        {event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Lokasi</div>
                      <div className="text-muted-foreground">{event.location}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Ketersediaan Kuota</div>
                      <div className="text-muted-foreground">
                        Tersisa <strong className="text-foreground">{event.remaining_quota}</strong> dari {event.quota} kursi
                      </div>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Tombol Pendaftaran */}
                <div className="space-y-3">
                  {!isRegistrationOpen ? (
                    <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>Pendaftaran tidak dibuka (status event saat ini: {event.status}).</span>
                    </div>
                  ) : isFull ? (
                    <div className="p-3 rounded-lg bg-destructive/10 text-xs text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Maaf, kuota peserta untuk event ini telah habis.</span>
                    </div>
                  ) : !isStudent ? (
                    <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-blue-500" />
                      <span>Anda login sebagai {profile?.role}. Hanya akun Mahasiswa yang dapat mendaftar.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button className="w-full gap-2 font-semibold" size="lg" disabled>
                        <Ticket className="h-4 w-4" />
                        <span>Daftar Event (Tersedia di Iterasi 4)</span>
                      </Button>
                      <p className="text-[11px] text-center text-muted-foreground">
                        Fitur pendaftaran event akan diaktifkan penuh pada Iterasi 4.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
