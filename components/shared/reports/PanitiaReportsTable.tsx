'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Users,
  QrCode,
  Calendar,
  Search,
  Printer,
} from 'lucide-react'

export interface PanitiaEventReportItem {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  event_date: string
  quota: number
  price: number
  category_name: string
  registered_count: number
  checked_in_count: number
  paid_revenue: number
  paid_tickets_count: number
}

interface PanitiaReportsTableProps {
  events: PanitiaEventReportItem[]
}

export function PanitiaReportsTable({ events }: PanitiaReportsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = events.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Agregasi dari list yang sedang difilter
  const totalFilteredRegistered = filteredEvents.reduce((acc, e) => acc + e.registered_count, 0)
  const totalFilteredCheckedIn = filteredEvents.reduce((acc, e) => acc + e.checked_in_count, 0)
  const totalFilteredRevenue = filteredEvents.reduce((acc, e) => acc + e.paid_revenue, 0)

  const getStatusBadge = (status: PanitiaEventReportItem['status']) => {
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

  return (
    <div className="space-y-6">
      {/* Kontrol Pencarian & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari judul event atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="text-xs"
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 print:hidden"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Rekap</span>
          </Button>
        </div>
      </div>

      {/* Ringkasan Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 bg-muted/40 rounded-lg border">
          <div className="text-xs text-muted-foreground font-medium">Total Pendaftar Terpilih</div>
          <div className="text-xl font-bold mt-0.5">{totalFilteredRegistered} Peserta</div>
        </div>
        <div className="p-3 bg-muted/40 rounded-lg border">
          <div className="text-xs text-muted-foreground font-medium">Total Kehadiran Terpilih</div>
          <div className="text-xl font-bold mt-0.5">
            {totalFilteredCheckedIn} Hadir{' '}
            <span className="text-xs font-normal text-muted-foreground">
              ({totalFilteredRegistered > 0 ? Math.round((totalFilteredCheckedIn / totalFilteredRegistered) * 100) : 0}%)
            </span>
          </div>
        </div>
        <div className="p-3 bg-muted/40 rounded-lg border">
          <div className="text-xs text-muted-foreground font-medium">Total Omset Tiket Terpilih</div>
          <div className="text-xl font-bold text-primary mt-0.5">{formatCurrency(totalFilteredRevenue)}</div>
        </div>
      </div>

      {/* Tabel Rekapitulasi Event */}
      {filteredEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-base">Tidak Ada Data Event</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tidak ditemukan data event yang sesuai dengan filter pencarian saat ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Event & Kategori</th>
                <th className="px-4 py-3">Tanggal Pelaksanaan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Kuota / Terisi</th>
                <th className="px-4 py-3 text-right">Kehadiran (Check-in)</th>
                <th className="px-4 py-3 text-right">Pemasukan (PAID)</th>
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
                      <div className="text-xs text-muted-foreground mt-0.5">{evt.category_name}</div>
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
                        {fillPercent}% terisi
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
                        {evt.paid_tickets_count} tiket lunas
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/panitia/events/${evt.id}/participants`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                            <Users className="h-3 w-3" />
                            <span>Peserta</span>
                          </Button>
                        </Link>
                        {evt.status === 'ONGOING' && (
                          <Link href={`/panitia/events/${evt.id}/checkin`}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 text-primary">
                              <QrCode className="h-3 w-3" />
                              <span>Check-in</span>
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
