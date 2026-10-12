import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AdminReportsView,
  AdminEventReportItem,
  AdminCategoryReportItem,
  AdminPaymentMethodBreakdown,
} from '@/components/shared/reports/AdminReportsView'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Users, QrCode, DollarSign } from 'lucide-react'

export const instant = false

export default async function AdminReportsPage() {
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

  // 1. Ambil seluruh event beserta statistik pendaftar dari view
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
      category_name,
      organizer_name,
      category_id
    `)
    .order('event_date', { ascending: false })

  const events = rawEvents || []

  // 2. Ambil seluruh kategori
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  const categories = rawCategories || []

  // 3. Ambil data check-in seluruh kampus
  const { data: rawCheckins } = await supabase
    .from('checkins')
    .select('id, ticket:tickets!inner(registration:registrations!inner(event_id))')

  type CheckinRow = {
    id: string
    ticket: {
      registration: {
        event_id: string
      }
    }
  }
  const checkinRows = (rawCheckins || []) as unknown as CheckinRow[]

  // 4. Ambil data pembayaran PAID seluruh kampus
  const { data: rawPayments } = await supabase
    .from('payments')
    .select('amount, method, status, registration:registrations!inner(event_id)')
    .eq('status', 'PAID')

  type PaymentRow = {
    amount: number
    method: 'TRANSFER_BANK' | 'E_WALLET' | 'CASH' | null
    status: string
    registration: {
      event_id: string
    }
  }
  const paymentRows = (rawPayments || []) as unknown as PaymentRow[]

  // Petakan statistik ke setiap item event
  const eventReports: AdminEventReportItem[] = events.map((evt) => {
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
      organizer_name: evt.organizer_name || 'Panitia Kampus',
      registered_count: evt.registered_count || 0,
      checked_in_count: eventCheckins.length,
      paid_revenue: revenue,
      paid_tickets_count: eventPayments.length,
    }
  })

  // Petakan statistik ke setiap kategori
  const categoryReports: AdminCategoryReportItem[] = categories.map((cat) => {
    const catEvents = eventReports.filter((e) => e.category_name === cat.name)
    const eventCount = catEvents.length
    const registeredCount = catEvents.reduce((acc, e) => acc + e.registered_count, 0)
    const totalRevenue = catEvents.reduce((acc, e) => acc + e.paid_revenue, 0)

    return {
      id: cat.id,
      name: cat.name,
      event_count: eventCount,
      registered_count: registeredCount,
      total_revenue: totalRevenue,
    }
  })

  // Breakdown metode pembayaran
  const paymentMethodsMap: Record<string, { count: number; amount: number }> = {
    TRANSFER_BANK: { count: 0, amount: 0 },
    E_WALLET: { count: 0, amount: 0 },
    CASH: { count: 0, amount: 0 },
  }

  paymentRows.forEach((p) => {
    const m = p.method || 'LAINNYA'
    if (!paymentMethodsMap[m]) {
      paymentMethodsMap[m] = { count: 0, amount: 0 }
    }
    paymentMethodsMap[m].count += 1
    paymentMethodsMap[m].amount += p.amount || 0
  })

  const paymentMethodsBreakdown: AdminPaymentMethodBreakdown[] = Object.entries(
    paymentMethodsMap
  ).map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
  }))

  // KPI Global
  const totalEventsCount = eventReports.length
  const totalRegistrationsCount = eventReports.reduce((acc, e) => acc + e.registered_count, 0)
  const totalCheckInsCount = checkinRows.length
  const totalGrossRevenue = paymentRows.reduce((acc, p) => acc + (p.amount || 0), 0)
  const campusAttendanceRate = totalRegistrationsCount > 0
    ? Math.round((totalCheckInsCount / totalRegistrationsCount) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile.full_name,
          role: profile.role,
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Sistem CampusEvent</h1>
            <p className="text-muted-foreground mt-1">
              Rekapitulasi komprehensif seluruh operasional kegiatan kampus, partisipasi mahasiswa, dan transaksi tiket.
            </p>
          </div>
        </div>

        {/* Kartu Ringkasan KPI Global Admin */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Event Kampus</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEventsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Semua panitia terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendaftar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrationsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Akumulasi seluruh event</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kehadiran (Check-in)</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campusAttendanceRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalCheckInsCount} dari {totalRegistrationsCount} peserta hadir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Omset Tiket</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalGrossRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">{paymentRows.length} transaksi status PAID</p>
            </CardContent>
          </Card>
        </div>

        {/* Tampilan Laporan Tabular */}
        <AdminReportsView
          events={eventReports}
          categories={categoryReports}
          paymentMethods={paymentMethodsBreakdown}
        />
      </main>
    </div>
  )
}
