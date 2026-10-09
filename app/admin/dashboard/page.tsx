import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, ShieldCheck, DollarSign, Layers, ArrowRight } from 'lucide-react'
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

  // Hitung jumlah data aktual
  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalCategories },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ])

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrator</h1>
          <p className="text-muted-foreground mt-1">
            Panel kendali utama sistem manajemen CampusEvent.
          </p>
        </div>

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
              <CardTitle className="text-sm font-medium">Total Event</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Seluruh status & panitia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kategori Aktif</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Kategori terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground mt-1">Status PAID (Iterasi 5)</p>
            </CardContent>
          </Card>
        </div>

        {/* Akses Cepat Modul Iterasi 3 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>Kelola Kategori Event</span>
              </CardTitle>
              <CardDescription>
                Atur kategori kegiatan (Seminar, Workshop, Lomba, dll) untuk kebutuhan pendaftaran panitia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/categories">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <span>Buka Kelola Kategori</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Pantau Semua Event</span>
              </CardTitle>
              <CardDescription>
                Lihat dan kelola seluruh event yang dibuat oleh seluruh panitia kampus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/events">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <span>Buka Semua Event</span>
                  <ArrowRight className="h-4 w-4" />
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
              Akun ini memegang hak akses penuh ke seluruh pengaturan sistem CampusEvent.
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
