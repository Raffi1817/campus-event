import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  Calendar,
  ShieldCheck,
  DollarSign,
  Layers,
  ArrowRight,
  ClipboardList,
  QrCode,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

export const instant = false

export default async function AdminDashboard() {
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

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Hitung metrik aktual secara paralel
  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalRegistrations },
    { count: totalCheckIns },
    { data: paidPayments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('checkins').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'PAID'),
  ])

  // Perhitungan D19: Total transaksi (jumlah pembayaran PAID + total nominalnya)
  const paidCount = paidPayments?.length ?? 0
  const totalGrossRevenue = (paidPayments || []).reduce((acc, p) => acc + (p.amount || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile.full_name,
          role: profile.role,
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrator</h1>
            <p className="text-muted-foreground mt-1">
              Panel kendali utama dan statistik sistem manajemen CampusEvent.
            </p>
          </div>
          <Link href="/admin/reports">
            <Button className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Buka Laporan Sistem</span>
            </Button>
          </Link>
        </div>

        {/* Kartu Metrik Utama */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Admin, Panitia, & Mahasiswa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Event Kampus</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Semua status & panitia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendaftar & Hadir</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCheckIns ?? 0} / {totalRegistrations ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Rasio hadir:{' '}
                <span className="font-semibold text-primary">
                  {totalRegistrations ? Math.round(((totalCheckIns ?? 0) / totalRegistrations) * 100) : 0}%
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalGrossRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">{paidCount} pembayaran status PAID</p>
            </CardContent>
          </Card>
        </div>

        {/* Akses Cepat Modul Admin */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Laporan Komprehensif</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Rekapitulasi omset, performa event, dan breakdown per kategori.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs">
                  <span>Lihat Laporan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <span>Kelola Pendaftaran</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Pantau seluruh data pendaftar dan konfirmasi pembayaran manual Cash.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/registrations">
                <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs">
                  <span>Buka Pendaftaran</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Semua Event</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Pantau dan kendalikan status seluruh event di seluruh kepanitiaan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/events">
                <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs">
                  <span>Buka Semua Event</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Kelola Kategori</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Tambah, ubah, atau hapus kategori kegiatan event mahasiswa kampus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/categories">
                <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs">
                  <span>Buka Kategori</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-purple-200 dark:border-purple-900">
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Profil Administrator Sistem</span>
            </CardTitle>
            <CardDescription>
              Akun ini memegang hak akses penuh ke seluruh operasional dan data CampusEvent.
            </CardDescription>
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
