import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Ticket,
  Users,
  Search,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react'
import { Footer, HomeUserMenu, HeroParticles } from '@/components/shared/layout'
import { createClient } from '@/lib/supabase/server'
import { connection } from 'next/server'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

export const instant = false

interface PreviewEvent {
  id: string
  title: string
  category_name: string
  organizer_name: string
  event_date: string
  start_time: string | null
  location: string
  price: number
  remaining_quota: number
  poster_url: string | null
}

const FALLBACK_FEATURED_EVENTS: PreviewEvent[] = [
  {
    id: 'preview-1',
    title: 'Seminar Nasional AI & Peluang Karir Digital 2026',
    category_name: 'Seminar',
    organizer_name: 'BEM Fakultas Ilmu Komputer',
    event_date: '2026-11-15T09:00:00',
    start_time: '09:00:00',
    location: 'Auditorium Utama & Zoom',
    price: 0,
    remaining_quota: 42,
    poster_url: null,
  },
  {
    id: 'preview-2',
    title: 'Workshop Fullstack Web Modern dengan Next.js & Supabase',
    category_name: 'Workshop',
    organizer_name: 'Himpunan Mahasiswa Informatika',
    event_date: '2026-11-20T13:30:00',
    start_time: '13:30:00',
    location: 'Laboratorium Komputer Terpadu',
    price: 25000,
    remaining_quota: 18,
    poster_url: null,
  },
  {
    id: 'preview-3',
    title: 'Kompetisi Desain UI/UX & Prototipe Aplikasi Kampus',
    category_name: 'Lomba',
    organizer_name: 'UKM Riset & Multimedia Mahasiswa',
    event_date: '2026-11-28T08:00:00',
    start_time: '08:00:00',
    location: 'Gedung Serbaguna Kampus',
    price: 50000,
    remaining_quota: 6,
    poster_url: null,
  },
]

export default async function Home() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardUrl = '/dashboard'
  let profileName: string | null = null
  let role = 'MAHASISWA'

  let liveEvents: PreviewEvent[] = []
  let totalActiveCount = 20

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    profileName = profile?.full_name || null
    role = profile?.role || 'MAHASISWA'

    if (role === 'ADMIN') dashboardUrl = '/admin/dashboard'
    else if (role === 'PANITIA') dashboardUrl = '/panitia/dashboard'
    else dashboardUrl = '/dashboard'

    // Ambil cuplikan event aktif dari view resmi events_with_stats
    const { data: dbEvents, count } = await supabase
      .from('events_with_stats')
      .select('*', { count: 'exact' })
      .in('status', ['PUBLISHED', 'ONGOING'])
      .order('event_date', { ascending: true })
      .limit(3)

    if (dbEvents && dbEvents.length > 0) {
      liveEvents = dbEvents.map((ev, index) => ({
        id: ev.id || `event-${index}`,
        title: ev.title || 'Event Kampus',
        category_name: ev.category_name || 'Umum',
        organizer_name: ev.organizer_name || 'Panitia Kampus',
        event_date: ev.event_date || new Date().toISOString(),
        start_time: ev.start_time,
        location: ev.location || 'Kampus',
        price: ev.price ?? 0,
        remaining_quota: ev.remaining_quota ?? 0,
        poster_url: ev.poster_url,
      }))
    }
    if (count !== null && count !== undefined && count > 0) {
      totalActiveCount = count
    }
  }

  const displayEvents = liveEvents.length > 0 ? liveEvents : FALLBACK_FEATURED_EVENTS

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-extrabold text-lg text-primary tracking-tight">
            CampusEvent
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link
              href="/events"
              className="hover:text-primary transition-colors"
            >
              Jelajah Event
            </Link>
            <a href="#fitur" className="hover:text-primary transition-colors">
              Pilar Sistem
            </a>
          </nav>

          {user ? (
            <HomeUserMenu
              user={{
                fullName: profileName || user.email || 'Pengguna',
                email: user.email || '',
                role,
                dashboardUrl,
              }}
            />
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-[#FFD23F] px-4 py-2 text-xs sm:text-sm font-semibold text-[#14172B] shadow-xs transition-all hover:brightness-95 active:scale-[0.98]"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden isolate pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <HeroParticles />
          <div className="container relative z-10 mx-auto px-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground max-w-4xl mx-auto leading-tight">
              Temukan dan Ikuti Berbagai <br className="hidden sm:inline" />
              <span className="text-primary">Event Kampus Terbaik</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Satu sistem terintegrasi untuk mahasiswa, panitia pelaksana, dan pengelola kampus.
              Daftar seminar, workshop, dan kompetisi secara instan dengan tiket digital ber-QR code.
            </p>

            {/* Quick Search Bar */}
            <form action="/events" method="GET" className="mx-auto mt-8 max-w-2xl">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex items-center pl-3 text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="q"
                  placeholder="Cari seminar, workshop, lomba, atau lokasi kegiatan..."
                  className="w-full bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
                >
                  <span>Cari Event</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Popular Category Quick Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <span className="text-xs text-muted-foreground font-medium mr-1">Kategori:</span>
              {['Seminar', 'Workshop', 'Lomba', 'Pelatihan', 'Organisasi', 'Seni & Budaya'].map(
                (cat) => (
                  <Link
                    key={cat}
                    href={`/events?category=${encodeURIComponent(cat)}`}
                    className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-foreground/85 transition-colors hover:border-primary hover:text-primary hover:bg-primary-soft/40"
                  >
                    {cat}
                  </Link>
                )
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              {user ? (
                <>
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <span>Buka Katalog Lengkap</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={dashboardUrl}
                    className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border bg-card text-foreground font-semibold text-sm shadow-xs transition-all hover:bg-muted active:scale-[0.98]"
                  >
                    Ke Dashboard Saya
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center h-11 px-7 rounded-xl bg-[#FFD23F] text-[#14172B] font-semibold text-sm shadow-sm transition-all hover:brightness-95 active:scale-[0.98]"
                  >
                    Daftar Akun
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border bg-card text-foreground font-semibold text-sm shadow-xs transition-all hover:bg-muted active:scale-[0.98]"
                  >
                    Masuk ke Akun
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Live Social Proof Stats Strip */}
        <section className="border-y border-border bg-card py-6">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="space-y-1 py-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-primary">
                  {totalActiveCount}+
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Event Kampus Tersedia
                </div>
              </div>
              <div className="space-y-1 py-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">8 Kategori</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Pilihan Kegiatan Kampus
                </div>
              </div>
              <div className="space-y-1 py-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#0E8A6F]">100%</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Tiket Digital QR Valid
                </div>
              </div>
              <div className="space-y-1 py-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">WIB</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Jadwal & Kuota Realtime
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Event Pilihan Mendatang
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jelajahi agenda kegiatan kampus terdekat dan amankan kuota tiket Anda.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline self-start sm:self-auto"
            >
              <span>Lihat Semua Event ({totalActiveCount})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayEvents.map((ev) => {
              const isQuotaLow = ev.remaining_quota <= 10 && ev.remaining_quota > 0
              const isFree = ev.price === 0

              return (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md group"
                >
                  <div className="space-y-4">
                    {/* Header: Kategori & Status Kuota */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                        {ev.category_name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          isQuotaLow
                            ? 'bg-[#FFEBD1] text-[#8A4B00]'
                            : 'bg-[#DDF5EE] text-[#0A5F4D]'
                        }`}
                      >
                        {ev.remaining_quota > 0
                          ? `Sisa ${ev.remaining_quota} kuota`
                          : 'Kuota Penuh'}
                      </span>
                    </div>

                    {/* Judul Event */}
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {ev.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground font-medium">
                        Oleh: {ev.organizer_name}
                      </p>
                    </div>

                    {/* Detail Waktu & Lokasi */}
                    <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                        <span>{formatDate(ev.event_date)}</span>
                        {ev.start_time && (
                          <>
                            <span className="text-border">•</span>
                            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{formatTime(ev.start_time)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Card: Harga & Action Button */}
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        Biaya Pendaftaran
                      </span>
                      <span
                        className={`text-base font-extrabold ${
                          isFree ? 'text-[#0E8A6F]' : 'text-primary'
                        }`}
                      >
                        {isFree ? 'Gratis' : formatCurrency(ev.price)}
                      </span>
                    </div>

                    <Link
                      href={ev.id.startsWith('preview') ? '/events' : `/events/${ev.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-[0.98]"
                    >
                      <span>Detail Tiket</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Key Pillars Section */}
        <section id="fitur" className="border-t border-border bg-card/50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Pilar Layanan CampusEvent
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Ekosistem lengkap yang menghubungkan seluruh civitas akademika dalam satu platform.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#DDF5EE] text-[#0A5F4D]">
                  <Ticket className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Tiket Digital Instan</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Pendaftaran praktis dalam hitungan detik. E-tiket dengan kode unik dan barcode QR otomatis terbit untuk kemudahan check-in kehadiran di lokasi.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Khusus Panitia Kegiatan</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Kelola kuota peserta secara transparan, konfirmasi pembayaran pendaftaran tunai, serta verifikasi kehadiran cepat menggunakan pemindai QR.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFEBD1] text-[#8A4B00]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Keamanan & Kontrol Akses</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Perlindungan data terintegrasi dengan Row Level Security (RLS) PostgreSQL untuk memisahkan hak akses Mahasiswa, Panitia, dan Administrator.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
