import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Ticket, Bell, Compass, ArrowRight } from 'lucide-react'
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Event Diikuti</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Pendaftaran aktif (Iterasi 4)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiket Aktif</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Siap untuk check-in (Iterasi 5)</p>
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
