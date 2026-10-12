import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { TicketCard } from '@/components/shared/tickets'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketWithDetails } from '@/types/tickets'
import Link from 'next/link'
import { Ticket, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'

export const instant = false

export default async function MyTicketsPage() {
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

  // Ambil tiket mahasiswa dengan relasi ke registrasi, event, profil, dan check-in
  const { data: rawTickets } = await supabase
    .from('tickets')
    .select(`
      id,
      registration_id,
      ticket_code,
      status,
      issued_at,
      registration:registrations!inner (
        id,
        user_id,
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
        student:profiles (
          id,
          full_name,
          nim,
          email
        )
      ),
      checkins (
        id,
        checked_in_at
      )
    `)
    .eq('registration.user_id', user.id)
    .order('issued_at', { ascending: false })

  const tickets = (rawTickets || []) as unknown as TicketWithDetails[]
  const activeCount = tickets.filter((t) => t.status === 'ACTIVE').length

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
        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Tiket Saya
              </h1>
              {activeCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {activeCount} Aktif
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Tiket resmi kegiatan kampus. Tunjukkan kode tiket atau scan QR saat melakukan check-in di lokasi acara.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/my/registrations">
              <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
                <span>Riwayat Pendaftaran</span>
              </Button>
            </Link>
            <Link href="/events">
              <Button size="sm" className="text-xs h-9 gap-1.5 font-semibold">
                <Calendar className="h-4 w-4" />
                <span>Jelajah Event</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Info Banner Keamanan & Check-in */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-foreground block">
                Petunjuk Check-in Acara
              </span>
              <span>
                Setiap tiket berlaku untuk 1 kali check-in saat status event telah dibuka (ONGOING) oleh panitia.
              </span>
            </div>
          </div>
        </div>

        {/* Daftar Tiket atau Empty State */}
        {tickets.length === 0 ? (
          <Card className="border-dashed py-14 text-center shadow-xs">
            <CardContent className="space-y-4 max-w-md mx-auto">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Ticket className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold">Belum Ada Tiket</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Anda belum memiliki tiket event. Tiket akan otomatis terbit saat Anda mendaftar event gratis atau menyelesaikan pembayaran event berbayar.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link href="/my/registrations">
                  <Button variant="outline" size="sm" className="text-xs">
                    Cek Status Pembayaran
                  </Button>
                </Link>
                <Link href="/events">
                  <Button size="sm" className="text-xs gap-1.5">
                    <span>Cari Event Kampus</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
