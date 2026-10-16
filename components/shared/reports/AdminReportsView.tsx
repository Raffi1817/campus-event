'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Calendar,
  Search,
  Printer,
  Layers,
  CreditCard,
  Building2,
  ExternalLink,
  Download,
} from 'lucide-react'

export interface AdminEventReportItem {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  event_date: string
  quota: number
  price: number
  category_name: string
  organizer_name: string
  registered_count: number
  checked_in_count: number
  paid_revenue: number
  paid_tickets_count: number
}

export interface AdminCategoryReportItem {
  id: string
  name: string
  event_count: number
  registered_count: number
  total_revenue: number
}

export interface AdminPaymentMethodBreakdown {
  method: string
  count: number
  amount: number
}

interface AdminReportsViewProps {
  events: AdminEventReportItem[]
  categories: AdminCategoryReportItem[]
  paymentMethods: AdminPaymentMethodBreakdown[]
}

export function AdminReportsView({
  events,
  categories,
  paymentMethods,
}: AdminReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'CATEGORIES' | 'PAYMENTS'>('EVENTS')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter Event
  const filteredEvents = events.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || item.category_name === categoryFilter
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organizer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  // Agregasi event yang difilter
  const filteredRegistered = filteredEvents.reduce((acc, e) => acc + e.registered_count, 0)
  const filteredCheckedIn = filteredEvents.reduce((acc, e) => acc + e.checked_in_count, 0)
  const filteredRevenue = filteredEvents.reduce((acc, e) => acc + e.paid_revenue, 0)

  const getStatusBadge = (status: AdminEventReportItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">PUBLISHED</Badge>
      case 'ONGOING':
        return <Badge className="bg-blue-600 hover:bg-blue-700 animate-pulse">ONGOING</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary">COMPLETED</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">CANCELLED</Badge>
      default:
        return <Badge variant="outline">DRAFT</Badge>
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const uniqueCategories = Array.from(new Set(events.map((e) => e.category_name))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Tab Navigasi Laporan */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'EVENTS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('EVENTS')}
            className="text-xs gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Rekapitulasi Event ({events.length})</span>
          </Button>
          <Button
            variant={activeTab === 'CATEGORIES' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('CATEGORIES')}
            className="text-xs gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Performa Kategori ({categories.length})</span>
          </Button>
          <Button
            variant={activeTab === 'PAYMENTS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('PAYMENTS')}
            className="text-xs gap-1.5"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Metode Pembayaran</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Laporan</span>
          </Button>
          <a href="/admin/reports/export" download className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Unduh CSV</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Konten Tab: REKAP EVENT */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-6">
          {/* Kontrol Pencarian & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari judul, panitia, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-md border bg-background text-foreground"
              >
                <option value="ALL">Semua Kategori</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-md border bg-background text-foreground"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          </div>

          {/* Mini KPI Terfilter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/40 rounded-lg border">
              <div className="text-xs text-muted-foreground font-medium">Total Pendaftar (Filter)</div>
              <div className="text-xl font-bold mt-0.5">{filteredRegistered} Peserta</div>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border">
              <div className="text-xs text-muted-foreground font-medium">Kehadiran (Filter)</div>
              <div className="text-xl font-bold mt-0.5">
                {filteredCheckedIn} Hadir{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({filteredRegistered > 0 ? Math.round((filteredCheckedIn / filteredRegistered) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border">
              <div className="text-xs text-muted-foreground font-medium">Omset Tiket (Filter)</div>
              <div className="text-xl font-bold text-primary mt-0.5">{formatCurrency(filteredRevenue)}</div>
            </div>
          </div>

          {/* Tabel Event */}
          {filteredEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-base">Tidak Ada Data Event</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Tidak ditemukan event yang cocok dengan kriteria filter saat ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border bg-card overflow-x-auto shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Event & Panitia</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Kuota / Terisi</th>
                    <th className="px-4 py-3 text-right">Kehadiran</th>
                    <th className="px-4 py-3 text-right">Omset (PAID)</th>
                    <th className="px-4 py-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEvents.map((evt) => {
                    const fillPercent = evt.quota > 0 ? Math.round((evt.registered_count / evt.quota) * 100) : 0
                    const attendancePercent = evt.registered_count > 0 ? Math.round((evt.checked_in_count / evt.registered_count) * 100) : 0

                    return (
                      <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-foreground leading-snug">{evt.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 inline text-muted-foreground" />
                            <span>Panitia: {evt.organizer_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <Badge variant="outline">{evt.category_name}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {formatDate(evt.event_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(evt.status)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="font-medium text-xs">
                            {evt.registered_count} / {evt.quota}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {fillPercent}% kuota
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="font-medium text-xs">
                            {evt.checked_in_count} hadir
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {attendancePercent}% hadir
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="font-semibold text-xs text-primary">
                            {formatCurrency(evt.paid_revenue)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {evt.paid_tickets_count} tiket
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap print:hidden">
                          <Link href={`/admin/registrations`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                              <ExternalLink className="h-3 w-3" />
                              <span>Lihat</span>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Konten Tab: REKAP KATEGORI */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rekapitulasi Kategori Event Kampus</CardTitle>
              <CardDescription>
                Distribusi kegiatan, partisipasi mahasiswa, dan total perputaran tiket per bidang kategori.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                    <tr>
                      <th className="px-4 py-3">Nama Kategori</th>
                      <th className="px-4 py-3 text-right">Jumlah Event</th>
                      <th className="px-4 py-3 text-right">Total Pendaftar</th>
                      <th className="px-4 py-3 text-right">Total Omset (PAID)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {cat.name}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {cat.event_count} event
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {cat.registered_count} peserta
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-primary">
                          {formatCurrency(cat.total_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Konten Tab: BREAKDOWN METODE PEMBAYARAN */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Breakdown Metode Pembayaran (Status: PAID)</CardTitle>
              <CardDescription>
                Distribusi pilihan kanal pembayaran yang digunakan mahasiswa untuk transaksi tiket lunas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {paymentMethods.map((pm) => (
                  <div key={pm.method} className="p-4 rounded-lg border bg-muted/20 space-y-1.5">
                    <div className="text-xs text-muted-foreground font-semibold">
                      {pm.method.replace('_', ' ')}
                    </div>
                    <div className="text-2xl font-bold">{pm.count} Transaksi</div>
                    <div className="text-xs font-semibold text-primary">
                      {formatCurrency(pm.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-md border bg-card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                    <tr>
                      <th className="px-4 py-3">Kanal Pembayaran</th>
                      <th className="px-4 py-3 text-right">Frekuensi Transaksi</th>
                      <th className="px-4 py-3 text-right">Total Akumulasi Rupiah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paymentMethods.map((pm) => (
                      <tr key={pm.method} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {pm.method.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {pm.count} transaksi lunas
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-primary">
                          {formatCurrency(pm.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
