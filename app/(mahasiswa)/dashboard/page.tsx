import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Ticket, Bell, Compass, ArrowRight, ClipboardList, CheckCircle2, Clock3 } from 'lucide-react'
import Link from 'next/link'

export const instant = false

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

  // Ambil jumlah pendaftaran mahasiswa secara riil
  const { count: registeredCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Ambil 3 pendaftaran terakhir
  const { data: rawRecent } = await supabase
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

  const recentRegistrations = (rawRecent || []) as unknown as RecentItem[]

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Mahasiswa</h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang kembali, {profile?.full_name}. Pantau pendaftaran dan tiket event Anda di sini.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/my/registrations" className="block group">
            <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                  Event Diikuti
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{registeredCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Lihat riwayat pendaftaran</span>
                  <ArrowRight className="h-3 w-3 inline" />
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiket Aktif</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentRegistrations.filter((r) => r.payment?.status === 'PAID').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Diterbitkan saat lunas (Iterasi 5)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notifikasi</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Pemberitahuan belum dibaca (Iterasi 7)</p>
            </CardContent>
          </Card>
        </div>

        {/* Riwayat Pendaftaran Terbaru jika ada */}
        {recentRegistrations.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Pendaftaran Terbaru</CardTitle>
                <CardDescription>Kegiatan kampus yang baru saja Anda daftarkan</CardDescription>
              </div>
              <Link href="/my/registrations">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <span>Lihat Semua</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRegistrations.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/events/${item.event?.id}`}
                      className="font-semibold text-sm hover:text-primary hover:underline transition-colors"
                    >
                      {item.event?.title}
                    </Link>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>{formatDate(item.event?.event_date || '')}</span>
                      <span>•</span>
                      <span>{item.event?.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {item.payment?.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>PAID</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                        <Clock3 className="h-3 w-3" />
                        <span>PENDING</span>
                      </span>
                    )}
                    <span className="text-xs font-bold text-primary">
                      {item.event?.price === 0 ? 'Gratis' : formatCurrency(item.payment?.amount ?? item.event?.price ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Akses Cepat Jelajah Event (Iterasi 3) */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>Jelajah Event Kampus</span>
            </CardTitle>
            <CardDescription>
              Temukan kegiatan seminar, lomba, pelatihan, dan workshop menarik yang sedang dibuka di kampus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/events">
              <Button className="gap-2">
                <span>Buka Katalog Event</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profil Mahasiswa</CardTitle>
            <CardDescription>Informasi akun mahasiswa terdaftar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-semibold">Nama:</span> {profile?.full_name}</div>
            <div><span className="font-semibold">NIM:</span> {profile?.nim || '-'}</div>
            <div><span className="font-semibold">Email:</span> {profile?.email}</div>
            <div><span className="font-semibold">Role:</span> {profile?.role}</div>
            <div><span className="font-semibold">Status:</span> {profile?.is_active ? 'Aktif' : 'Nonaktif'}</div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

