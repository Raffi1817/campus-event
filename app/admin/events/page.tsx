import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import { Calendar, MapPin, Users, Edit3, ExternalLink, Shield } from 'lucide-react'

export const instant = false

export default async function AdminEventsPage() {
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

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Admin dapat membaca semua event (termasuk Draft seluruh panitia) dari events_with_stats
  const { data: events, error } = await supabase
    .from('events_with_stats')
    .select('*')
    .order('created_at', { ascending: false })

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success'
      case 'ONGOING':
        return 'info'
      case 'COMPLETED':
        return 'muted'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Semua Event Kampus</h1>
              <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 dark:text-purple-300">
                <Shield className="h-3 w-3" />
                <span>Admin View</span>
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Pantau dan kendalikan seluruh kegiatan event dari seluruh panitia dan organisasi mahasiswa.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            Gagal memuat data event: {error.message}
          </div>
        )}

        {!events || events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Belum Ada Event Terdaftar</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Belum ada panitia yang membuat event di dalam platform ini.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={getStatusBadgeVariant(event.status)}>
                      {event.status}
                    </Badge>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {event.category_name}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-2 mt-2">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(event.event_date || '')} · {formatTime(event.start_time)}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span>Penyelenggara: </span>
                    <strong className="text-foreground">{event.organizer_name}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Pendaftar:</span>
                      <strong className="text-foreground">{event.registered_count ?? 0} / {event.quota}</strong>
                    </div>
                    <div className="font-semibold text-primary">
                      {event.price === 0 ? 'Gratis' : formatCurrency(event.price || 0)}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link href={`/events/${event.id}`} target="_blank">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Pratinjau</span>
                      </Button>
                    </Link>
                    <Link href={`/panitia/events/${event.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Ubah / Status</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
