import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PanitiaReportsTable, PanitiaEventReportItem } from '@/components/shared/reports/PanitiaReportsTable'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Users, QrCode, DollarSign } from 'lucide-react'

export const instant = false

export default async function PanitiaReportsPage() {
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

  if (!profile || (profile.role !== 'PANITIA' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  // 1. Ambil event panitia via view events_with_stats
  const { data: rawEvents } = await supabase
    .from('events_with_stats')
    .select(`
      id,
      title,
      status,
      event_date,
      quota,
      price,
      registered_count,
      category_name
    `)
    .eq('organizer_id', user.id)
    .order('event_date', { ascending: false })

  const events = rawEvents || []
  const eventIds = events.map((e) => e.id)

  let checkinRows: Array<{ ticket: { registration: { event_id: string } } }> = []
  let paymentRows: Array<{ amount: number; registration: { event_id: string } }> = []

  if (eventIds.length > 0) {
    // 2. Ambil data check-in per event
    const { data: checkins } = await supabase
      .from('checkins')
      .select('id, ticket:tickets!inner(registration:registrations!inner(event_id))')
      .in('ticket.registration.event_id', eventIds)

    checkinRows = (checkins || []) as unknown as typeof checkinRows

    // 3. Ambil data pembayaran PAID per event
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, registration:registrations!inner(event_id)')
      .eq('status', 'PAID')
      .in('registration.event_id', eventIds)

    paymentRows = (payments || []) as unknown as typeof paymentRows
  }

  // Petakan statistik ke setiap item event
  const reportItems: PanitiaEventReportItem[] = events.map((evt) => {
    const eventCheckins = checkinRows.filter(
      (c) => c.ticket?.registration?.event_id === evt.id
    )
    const eventPayments = paymentRows.filter(
      (p) => p.registration?.event_id === evt.id
    )

    const revenue = eventPayments.reduce((acc, p) => acc + (p.amount || 0), 0)

    return {
      id: evt.id || '',
      title: evt.title || 'Tanpa Judul',
      status: evt.status || 'DRAFT',
      event_date: evt.event_date || '',
      quota: evt.quota || 0,
      price: evt.price || 0,
      category_name: evt.category_name || 'Umum',
      registered_count: evt.registered_count || 0,
      checked_in_count: eventCheckins.length,
      paid_revenue: revenue,
      paid_tickets_count: eventPayments.length,
    }
  })

  // Kalkulasi KPI Keseluruhan
  const totalEventsCount = reportItems.length
  const grandTotalRegistrations = reportItems.reduce((acc, e) => acc + e.registered_count, 0)
  const grandTotalCheckIns = reportItems.reduce((acc, e) => acc + e.checked_in_count, 0)
  const grandTotalRevenue = reportItems.reduce((acc, e) => acc + e.paid_revenue, 0)
  const overallAttendanceRate = grandTotalRegistrations > 0
    ? Math.round((grandTotalCheckIns / grandTotalRegistrations) * 100)
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
      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Penyelenggaraan Event</h1>
            <p className="text-muted-foreground mt-1">
              Rekapitulasi performa kuota, tingkat kehadiran peserta, dan pendapatan tiket untuk event Anda.
            </p>
          </div>
        </div>

        {/* Kartu Ringkasan KPI Global Panitia */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Event</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEventsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Event yang Anda kelola</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendaftar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grandTotalRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">Akumulasi seluruh event</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAttendanceRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {grandTotalCheckIns} dari {grandTotalRegistrations} peserta hadir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(grandTotalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Akumulasi status PAID</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Rekapitulasi Komprehensif */}
        <PanitiaReportsTable events={reportItems} />
      </main>
    </div>
  )
}
