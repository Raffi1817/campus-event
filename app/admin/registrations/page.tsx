import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  ExternalLink,
  GraduationCap,
  CreditCard,
  FileText,
} from 'lucide-react'

export const instant = false

export default async function AdminRegistrationsPage() {
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

  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Ambil semua pendaftaran dari seluruh event
  const { data: rawRegistrations } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      event:events (
        id,
        title,
        status,
        event_date,
        price,
        category:categories (
          name
        ),
        organizer:profiles (
          full_name
        )
      ),
      student:profiles (
        id,
        full_name,
        nim,
        email
      ),
      payment:payments (
        id,
        amount,
        method,
        status,
        paid_at
      )
    `)
    .order('created_at', { ascending: false })

  interface AdminRegistrationItem {
    id: string
    created_at: string
    event: {
      id: string
      title: string
      status: string
      event_date: string
      price: number
      category: { name: string } | null
      organizer: { full_name: string } | null
    } | null
    student: {
      id: string
      full_name: string
      nim: string | null
      email: string
    } | null
    payment: {
      id: string
      amount: number
      method: string | null
      status: 'PENDING' | 'PAID' | 'FAILED'
      paid_at: string | null
    } | null
  }

  const registrations = (rawRegistrations || []) as unknown as AdminRegistrationItem[]

  const totalRegistrations = registrations.length
  const paidCount = registrations.filter((r) => r.payment?.status === 'PAID').length
  const pendingCount = registrations.filter((r) => r.payment?.status === 'PENDING').length
  const totalPaidAmount = registrations
    .filter((r) => r.payment?.status === 'PAID')
    .reduce((acc, curr) => acc + (curr.payment?.amount || 0), 0)

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>PAID</span>
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            <span>FAILED</span>
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock3 className="h-3 w-3" />
            <span>PENDING</span>
          </span>
        )
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

      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pantau Pendaftaran Event
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitoring seluruh riwayat pendaftaran mahasiswa di semua kegiatan kampus.
          </p>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Total Pendaftaran
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">Semua status pendaftaran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Pendaftaran Lunas
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {paidCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tiket aktif diterbitkan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Menunggu Pembayaran
              </CardTitle>
              <Clock3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {pendingCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Memegang kuota pendaftaran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Volume Transaksi Lunas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalPaidAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Dari {paidCount} pendaftar</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Seluruh Pendaftaran */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Semua Pendaftaran Mahasiswa</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                Menampilkan {registrations.length} data
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {registrations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-base font-semibold">Belum Ada Pendaftaran</div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Belum ada transaksi pendaftaran mahasiswa yang tercatat dalam sistem.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-y text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">No</th>
                      <th className="px-4 py-3 font-semibold">Mahasiswa</th>
                      <th className="px-4 py-3 font-semibold">Event</th>
                      <th className="px-4 py-3 font-semibold">Penyelenggara</th>
                      <th className="px-4 py-3 font-semibold">Biaya</th>
                      <th className="px-4 py-3 font-semibold">Status Bayar</th>
                      <th className="px-4 py-3 font-semibold">Tanggal Daftar</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {registrations.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-medium">
                          <div className="font-semibold text-foreground">
                            {item.student?.full_name || 'Tidak diketahui'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            {item.student?.nim && (
                              <span className="font-mono flex items-center gap-1">
                                <GraduationCap className="h-3 w-3 text-primary" />
                                {item.student.nim} ·
                              </span>
                            )}
                            <span>{item.student?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground line-clamp-1">
                            {item.event?.title || 'Event Tidak Dikenal'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            {item.event?.category?.name && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                {item.event.category.name}
                              </Badge>
                            )}
                            <span className="text-[11px]">{formatDate(item.event?.event_date || '')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {item.event?.organizer?.full_name || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold">
                          {item.event?.price === 0
                            ? 'Gratis'
                            : formatCurrency(item.payment?.amount ?? item.event?.price ?? 0)}
                        </td>
                        <td className="px-4 py-3.5">{getPaymentBadge(item.payment?.status)}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.event && (
                              <Link href={`/panitia/events/${item.event.id}/participants`}>
                                <button
                                  className="text-xs text-primary hover:underline flex items-center gap-1 p-1 rounded"
                                  title="Lihat Peserta Event Ini"
                                >
                                  <span>Peserta</span>
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
