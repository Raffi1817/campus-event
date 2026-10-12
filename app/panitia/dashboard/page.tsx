import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Users, QrCode, PlusCircle, ArrowRight, DollarSign, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export const instant = false

export default async function PanitiaDashboard() {
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

  if (!profile || profile.role !== 'PANITIA') {
    redirect('/dashboard')
  }

  // Ambil seluruh event yang dikelola panitia ini
  const { data: myEvents } = await supabase
    .from('events')
    .select('id, title, status, quota, price, event_date')
    .eq('organizer_id', user.id)

  const myEventIds = (myEvents || []).map((e) => e.id)
  const totalMyEvents = myEvents?.length ?? 0

  let totalRegistrations = 0
  let totalCheckIns = 0
  let totalRevenue = 0

  if (myEventIds.length > 0) {
    // 1. Hitung total pendaftar
    const { count: regCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .in('event_id', myEventIds)
    totalRegistrations = regCount ?? 0

    // 2. Hitung total check-in
    const { count: checkinCount } = await supabase
      .from('checkins')
      .select('id, ticket:tickets!inner(registration:registrations!inner(event_id))', { count: 'exact', head: true })
      .in('ticket.registration.event_id', myEventIds)
    totalCheckIns = checkinCount ?? 0

    // 3. Hitung total pendapatan dari pembayaran PAID
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount, registration:registrations!inner(event_id)')
      .eq('status', 'PAID')
      .in('registration.event_id', myEventIds)

    totalRevenue = (paidPayments || []).reduce((acc, p) => acc + (p.amount || 0), 0)
  }

  const attendanceRate = totalRegistrations > 0
    ? Math.round((totalCheckIns / totalRegistrations) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile?.full_name || 'Panitia',
          role: profile?.role || 'PANITIA',
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Panitia</h1>
            <p className="text-muted-foreground mt-1">
              Selamat datang, {profile?.full_name}. Pantau statistik kegiatan, peserta, dan check-in di sini.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/panitia/reports">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Laporan Event</span>
              </Button>
            </Link>
            <Link href="/panitia/events/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Buat Event Baru</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Kartu Metrik Panitia */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Event Dikelola</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMyEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Event aktif & arsip</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendaftar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">Seluruh event milik Anda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kehadiran Check-in</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCheckIns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tingkat kehadiran: <span className="font-semibold text-primary">{attendanceRate}%</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Pembayaran status PAID</p>
            </CardContent>
          </Card>
        </div>

        {/* Akses Cepat */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Kelola Event Saya</span>
              </CardTitle>
              <CardDescription>
                Pantau daftar event, ubah rincian pelaksanaan, dan atur transisi status event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/panitia/events">
                <Button variant="outline" className="gap-2 w-full">
                  <span>Buka Daftar Event</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Laporan & Statistik</span>
              </CardTitle>
              <CardDescription>
                Lihat rekapitulasi kuota terisi, rasio kehadiran, dan rincian omset tiket per event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/panitia/reports">
                <Button variant="outline" className="gap-2 w-full">
                  <span>Lihat Laporan Lengkap</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <span>Publikasikan Event</span>
              </CardTitle>
              <CardDescription>
                Buka pendaftaran kegiatan baru untuk mahasiswa kampus dengan mengisi form event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/panitia/events/new">
                <Button className="gap-2 w-full">
                  <span>Mulai Buat Event</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profil Panitia</CardTitle>
            <CardDescription>Informasi akun penyelenggara kegiatan kampus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-semibold">Nama:</span> {profile?.full_name}</div>
            <div><span className="font-semibold">Email:</span> {profile?.email}</div>
            <div><span className="font-semibold">Role:</span> {profile?.role}</div>
            <div><span className="font-semibold">Status Akun:</span> {profile?.is_active ? 'Aktif' : 'Nonaktif'}</div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
