import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Ticket,
  Bell,
  Compass,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Clock3,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export const instant = false

// Helper untuk menghitung mundur hari pelaksanaan event (zona WIB)
function getEventCountdown(eventDateStr: string | null) {
  if (!eventDateStr) return null

  // Gunakan tanggal kalender WIB hari ini
  const todayWibStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  const [tY, tM, tD] = todayWibStr.split('-').map(Number)
  const todayUtc = Date.UTC(tY, tM - 1, tD)

  const [year, month, day] = eventDateStr.split('-').map(Number)
  if (!year || !month || !day) return null

  const eventDateUtc = Date.UTC(year, month - 1, day)

  const diffMs = eventDateUtc - todayUtc
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: 'Selesai', variant: 'muted' as const }
  }
  if (diffDays === 0) {
    return { text: 'Hari ini', variant: 'destructive' as const }
  }
  if (diffDays === 1) {
    return { text: 'Besok', variant: 'warning' as const }
  }
  if (diffDays <= 7) {
    return { text: `${diffDays} hari lagi`, variant: 'info' as const }
  }
  return { text: `${diffDays} hari lagi`, variant: 'outline' as const }
}

export default async function MahasiswaDashboard() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'ADMIN') redirect('/admin/dashboard')
  if (profile?.role === 'PANITIA') redirect('/panitia/dashboard')

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())

  // 1. Ambil seluruh data pendaftaran mahasiswa untuk perhitungan metrik
  const { data: allUserRegs } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      event:events (
        id,
        event_date
      )
    `)
    .eq('user_id', user.id)

  const registeredCount = allUserRegs?.length ?? 0
  const upcomingRegisteredCount = (allUserRegs || []).filter(
    (r) => {
      const ev = Array.isArray(r.event) ? r.event[0] : r.event
      return ev?.event_date && ev.event_date >= todayStr
    }
  ).length

  const registeredEventIdSet = new Set(
    (allUserRegs || []).map((r) => r.event_id)
  )

  // 2. Ambil jumlah tiket aktif mahasiswa secara riil
  const { count: activeTicketCount } = await supabase
    .from('tickets')
    .select('id, registrations!inner(user_id)', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')
    .eq('registrations.user_id', user.id)

  // 3. Ambil jumlah notifikasi belum dibaca secara riil
  const { count: unreadNotificationCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  // 4. Ambil 3 notifikasi terbaru
  const { data: rawRecentNotifications } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // 5. Ambil 3 pendaftaran terakhir mahasiswa
  const { data: rawRecentRegistrations } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      event:events (
        id,
        title,
        event_date,
        location,
        price
      ),
      payment:payments (
        status,
        amount
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // 6. Ambil 3 rekomendasi event yang segera berlangsung (status PUBLISHED dan tanggal >= hari ini)
  const { data: rawRecommendedEvents } = await supabase
    .from('events_with_stats')
    .select('id, title, event_date, start_time, location, price, remaining_quota, category_name')
    .eq('status', 'PUBLISHED')
    .gte('event_date', todayStr)
    .order('event_date', { ascending: true })
    .limit(3)

  interface RecentItem {
    id: string
    created_at: string
    event: {
      id: string
      title: string
      event_date: string
      location: string
      price: number
    } | null
    payment: {
      status: 'PENDING' | 'PAID' | 'FAILED'
      amount: number
    } | null
  }

  const recentRegistrations = (rawRecentRegistrations || []) as unknown as RecentItem[]
  const recentNotifications = rawRecentNotifications || []
  const recommendedEvents = rawRecommendedEvents || []

  // Sapaan nama depan
  const firstName = profile?.full_name?.split(' ')[0] || 'Mahasiswa'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile?.full_name || 'Mahasiswa',
          role: profile?.role || 'MAHASISWA',
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header: Sapaan Personal + Info Akun Ringkas + CTA Utama */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Halo, {firstName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Selamat datang di portal kegiatan kampus. Pantau pendaftaran dan agenda Anda di sini.
            </p>
          </div>

          <Link href="/events" className="shrink-0">
            <Button className="gap-2 shadow-sm w-full sm:w-auto">
              <Compass className="h-4 w-4" />
              <span>Jelajah Event Kampus</span>
            </Button>
          </Link>
        </div>

        {/* 3 Kartu Statistik Ramping (Compact & Clickable) */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {/* Stat 1: Event Diikuti */}
          <Link href="/my/registrations" className="block group">
            <Card className="hover:border-primary/50 transition-all hover:shadow-sm cursor-pointer p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Event Diikuti
                </span>
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight">{registeredCount}</div>
                <span className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                  <span>Riwayat</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          </Link>

          {/* Stat 2: Tiket Aktif */}
          <Link href="/my/tickets" className="block group">
            <Card className="hover:border-emerald-500/50 transition-all hover:shadow-sm cursor-pointer p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">
                  Tiket Aktif
                </span>
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Ticket className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight">{activeTicketCount ?? 0}</div>
                <span className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-emerald-600 transition-colors">
                  <span>Tiket saya</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          </Link>

          {/* Stat 3: Event Mendatang */}
          <Link href="/my/registrations" className="block group">
            <Card className="hover:border-sky-500/50 transition-all hover:shadow-sm cursor-pointer p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-sky-600 transition-colors">
                  Event Mendatang
                </span>
                <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold tracking-tight">{upcomingRegisteredCount}</div>
                <span className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-sky-600 transition-colors">
                  <span>Agenda</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          </Link>
        </div>

        {/* Struktur Konten: 2 Kolom Asimetris Seimbang */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Kolom Kiri (2/3): Pendaftaran Terbaru & Rekomendasi Event */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seksi 1: Pendaftaran Terbaru */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Pendaftaran Terbaru</CardTitle>
                  <CardDescription className="text-xs">Kegiatan kampus yang baru Anda ikuti</CardDescription>
                </div>
                {recentRegistrations.length > 0 && (
                  <Link href="/my/registrations">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 px-2">
                      <span>Lihat Semua</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {recentRegistrations.length > 0 ? (
                  <div className="space-y-3">
                    {recentRegistrations.map((item) => {
                      const countdown = getEventCountdown(item.event?.event_date || null)
                      const isFree = item.event?.price === 0
                      const isPaid = item.payment?.status === 'PAID'
                      const isPending = item.payment?.status === 'PENDING'

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <Link
                              href={`/events/${item.event?.id}`}
                              className="font-medium text-sm hover:text-primary hover:underline transition-colors block truncate"
                            >
                              {item.event?.title}
                            </Link>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(item.event?.event_date || '')}
                              </span>
                              {countdown && (
                                <Badge variant={countdown.variant} className="text-[10px] h-4 px-1.5 py-0 font-medium">
                                  {countdown.text}
                                </Badge>
                              )}
                              <span>•</span>
                              <span className="truncate">{item.event?.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {/* Badge Status Pembayaran & Keikutsertaan */}
                            {isFree ? (
                              <Badge variant="success" className="gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>GRATIS</span>
                              </Badge>
                            ) : isPaid ? (
                              <Badge variant="success" className="gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>LUNAS</span>
                              </Badge>
                            ) : isPending ? (
                              <Badge variant="warning" className="gap-1 text-xs">
                                <Clock3 className="h-3 w-3" />
                                <span>BELUM BAYAR</span>
                              </Badge>
                            ) : (
                              <Badge variant={item.payment?.status === 'FAILED' ? 'destructive' : 'muted'} className="text-xs">
                                {item.payment?.status === 'FAILED' ? 'GAGAL' : (item.payment?.status || 'TERDAFTAR')}
                              </Badge>
                            )}

                            {/* Tombol Aksi Cepat */}
                            {isFree || isPaid ? (
                              <Link href="/my/tickets">
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 hover:border-primary">
                                  <Ticket className="h-3 w-3 text-primary" />
                                  <span>Lihat Tiket</span>
                                </Button>
                              </Link>
                            ) : isPending ? (
                              <Link href="/my/registrations">
                                <Button size="sm" className="h-7 px-2.5 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white">
                                  <Clock3 className="h-3 w-3" />
                                  <span>Bayar</span>
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/60" />
                    <p className="text-sm font-medium">Belum ada pendaftaran event</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Anda belum mendaftar kegiatan apapun. Lihat rekomendasi event di bawah untuk mulai berpartisipasi!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seksi 2: Rekomendasi Event Mendatang (Penyeimbang Layout Kiri) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">Event Mendatang untuk Anda</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Kegiatan kampus pilihan yang sedang membuka pendaftaran
                  </CardDescription>
                </div>
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 px-2">
                    <span>Semua Event</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recommendedEvents.length > 0 ? (
                  <div className="space-y-3">
                    {recommendedEvents.map((event) => {
                      const countdown = getEventCountdown(event.event_date)
                      const isAlreadyRegistered = registeredEventIdSet.has(event.id || '')

                      return (
                        <div
                          key={event.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/events/${event.id}`}
                                className="font-medium text-sm hover:text-primary hover:underline transition-colors truncate"
                              >
                                {event.title}
                              </Link>
                              {event.category_name && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 font-normal">
                                  {event.category_name}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(event.event_date || '')}
                              </span>
                              {countdown && (
                                <Badge variant={countdown.variant} className="text-[10px] h-4 px-1.5 py-0 font-medium">
                                  {countdown.text}
                                </Badge>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span>Sisa kuota: {event.remaining_quota ?? 0}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                            <span className="text-xs font-semibold text-foreground">
                              {event.price === 0 ? 'Gratis' : formatCurrency(event.price || 0)}
                            </span>
                            {isAlreadyRegistered ? (
                              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                                Sudah Terdaftar
                              </Badge>
                            ) : (
                              <Link href={`/events/${event.id}`}>
                                <Button size="sm" variant="default" className="h-7 px-2.5 text-xs gap-1">
                                  <span>Daftar</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Belum ada event mendatang yang dibuka saat ini.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan (1/3): Notifikasi Ringkas & Pintasan Cepat */}
          <div className="space-y-6">
            {/* Widget Notifikasi Terbaru */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Notifikasi</CardTitle>
                    {(unreadNotificationCount ?? 0) > 0 && (
                      <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {(unreadNotificationCount ?? 0) > 0
                      ? `${unreadNotificationCount} belum dibaca`
                      : 'Pemberitahuan terkini'}
                  </CardDescription>
                </div>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                    <span>Lihat Semua</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {recentNotifications.map((notif) => {
                      const isUnread = !notif.is_read
                      return (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-lg border text-xs transition-colors ${
                            isUnread
                              ? 'border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30'
                              : 'bg-muted/10 border-border/60 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-2 justify-between">
                            <div className="flex items-center gap-1.5 font-medium min-w-0">
                              {isUnread && (
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                              )}
                              <span className={`truncate ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {notif.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDate(notif.created_at)}
                            </span>
                          </div>
                          <p className={`mt-1 line-clamp-1 leading-relaxed ${isUnread ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                            {notif.message}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                    <Bell className="h-5 w-5 mx-auto text-muted-foreground/50" />
                    <p>Tidak ada notifikasi baru.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Widget Pintasan Cepat */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Pintasan Cepat</CardTitle>
                <CardDescription className="text-xs">
                  Akses langsung ke menu utama
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/my/tickets" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                    <span className="flex items-center gap-2">
                      <Ticket className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tiket & QR Check-in</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </Link>
                <Link href="/my/registrations" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                    <span className="flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-primary" />
                      <span>Riwayat Pendaftaran</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </Link>
                <Link href="/events" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                    <span className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-sky-600" />
                      <span>Katalog Semua Event</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
