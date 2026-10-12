import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { CancelRegistrationDialog } from '@/components/shared/registrations'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  AlertCircle,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react'

export const instant = false

export default async function MyRegistrationsPage() {
  await connection()
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

  if (profile?.role !== 'MAHASISWA') {
    redirect('/dashboard')
  }

  // Ambil daftar pendaftaran mahasiswa beserta detail event dan payment
  const { data: rawRegistrations } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      event:events (
        id,
        title,
        event_date,
        start_time,
        end_time,
        location,
        price,
        status,
        poster_url,
        category:categories (
          name
        )
      ),
      payment:payments (
        id,
        amount,
        method,
        status,
        paid_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  interface RegistrationItem {
    id: string
    created_at: string
    event: {
      id: string
      title: string
      event_date: string
      start_time: string
      end_time: string | null
      location: string
      price: number
      status: string
      poster_url: string | null
      category: { name: string } | null
    } | null
    payment: {
      id: string
      amount: number
      method: string | null
      status: 'PENDING' | 'PAID' | 'FAILED'
      paid_at: string | null
    } | null
  }

  const registrations = (rawRegistrations || []) as unknown as RegistrationItem[]

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            <span>Lunas (PAID)</span>
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
            <XCircle className="h-3 w-3" />
            <span>Gagal / Ditolak</span>
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <Clock3 className="h-3 w-3" />
            <span>Menunggu Pembayaran</span>
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile?.full_name || 'Mahasiswa',
          role: profile?.role || 'MAHASISWA',
          email: user.email || '',
        }}
      />

      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pendaftaran Saya</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Pantau riwayat keikutsertaan event, status pembayaran, dan tiket Anda di sini.
            </p>
          </div>
          <Link href="/events">
            <Button variant="outline" className="gap-2 text-xs h-9">
              <Calendar className="h-4 w-4" />
              <span>Jelajah Event Lainnya</span>
            </Button>
          </Link>
        </div>

        {registrations.length === 0 ? (
          <Card className="border-dashed py-12 text-center shadow-xs">
            <CardContent className="space-y-4 max-w-md mx-auto">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Ticket className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold">Belum Ada Pendaftaran</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Anda belum mendaftar ke kegiatan apa pun. Temukan seminar, workshop, atau kompetisi menarik di katalog event kampus.
                </p>
              </div>
              <Link href="/events" className="inline-block pt-2">
                <Button className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Jelajah Katalog Event Sekarang</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {registrations.map((reg) => {
              const event = reg.event
              const payment = reg.payment
              const isPaid = payment?.status === 'PAID'
              const canCancel = !isPaid

              return (
                <Card
                  key={reg.id}
                  className="overflow-hidden hover:shadow-md transition-shadow border bg-card"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header baris: Tanggal daftar & Status pembayaran */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs text-muted-foreground">
                      <div>
                        Didaftarkan pada:{' '}
                        <strong className="text-foreground">{formatDate(reg.created_at)}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(payment?.status)}
                        {event?.category?.name && (
                          <Badge variant="outline" className="text-[11px]">
                            {event.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Judul & Detail Informasi */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2 space-y-2.5">
                        <Link
                          href={`/events/${event?.id}`}
                          className="group inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          <h2 className="text-lg sm:text-xl font-bold group-hover:underline">
                            {event?.title || 'Event Tidak Dikenal'}
                          </h2>
                          <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 shrink-0" />
                        </Link>

                        <div className="grid gap-2 text-xs sm:grid-cols-2 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <span>{formatDate(event?.event_date || '')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary shrink-0" />
                            <span>
                              {formatTime(event?.start_time)}
                              {event?.end_time ? ` - ${formatTime(event.end_time)}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span className="line-clamp-1">{event?.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Biaya & Status Tiket */}
                      <div className="rounded-xl bg-muted/40 p-3.5 flex flex-col justify-between border space-y-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground uppercase font-medium">
                            Biaya Pendaftaran
                          </div>
                          <div className="text-lg font-extrabold text-primary mt-0.5">
                            {event?.price === 0 ? 'Gratis' : formatCurrency(payment?.amount ?? event?.price ?? 0)}
                          </div>
                        </div>

                        <div className="text-xs">
                          {isPaid ? (
                            <div className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Tiket Telah Terbit</span>
                            </div>
                          ) : (
                            <div className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Simulasi bayar aktif di Iterasi 5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer baris: Aksi */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {canCancel
                            ? 'Anda masih dapat membatalkan pendaftaran ini selama belum dibayar.'
                            : 'Pendaftaran lunas tidak dapat dibatalkan.'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {canCancel && (
                          <CancelRegistrationDialog
                            registrationId={reg.id}
                            eventTitle={event?.title || 'Event'}
                          />
                        )}
                        <Link href={`/events/${event?.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                            <span>Detail Event</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
