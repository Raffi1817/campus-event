import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, QrCode, PlusCircle, ArrowRight } from 'lucide-react'
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

  // Hitung jumlah event yang dikelola panitia ini
  const { count: totalMyEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', user.id)

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
              Selamat datang, {profile?.full_name}. Kelola event kampus, peserta, dan check-in di sini.
            </p>
          </div>
          <Link href="/panitia/events/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Buat Event Baru</span>
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Event Dikelola</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMyEvents ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Event milik Anda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendaftar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Peserta terdaftar (Iterasi 4)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Check-in Hadir</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Peserta yang telah check-in (Iterasi 6)</p>
            </CardContent>
          </Card>
        </div>

        {/* Akses Cepat */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Kelola Event Saya</span>
              </CardTitle>
              <CardDescription>
                Pantau daftar event, ubah informasi pelaksanaan, dan ubah status siklus hidup event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/panitia/events">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <span>Lihat Event Saya</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <span>Publikasikan Kegiatan Baru</span>
              </CardTitle>
              <CardDescription>
                Buka pendaftaran kegiatan baru untuk mahasiswa kampus dengan mengisi form event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/panitia/events/new">
                <Button className="gap-2 w-full sm:w-auto">
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
