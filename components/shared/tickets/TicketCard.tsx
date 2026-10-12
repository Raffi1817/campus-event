'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { TicketWithDetails } from '@/types/tickets'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Tag,
} from 'lucide-react'

interface TicketCardProps {
  ticket: TicketWithDetails
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [copied, setCopied] = useState(false)

  const reg = ticket.registration
  const event = reg?.event
  const student = reg?.student

  const checkinData = Array.isArray(ticket.checkins)
    ? ticket.checkins[0]
    : ticket.checkins
  const isCheckedIn = Boolean(checkinData)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticket_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Tiket Aktif</span>
          </span>
        )
      case 'USED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Telah Digunakan (USED)</span>
          </span>
        )
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-xs">
            <XCircle className="h-3.5 w-3.5" />
            <span>Dibatalkan</span>
          </span>
        )
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row">
      {/* Kolom Kiri: Detail Event & Identitas Mahasiswa */}
      <div className="flex-1 p-5 sm:p-6 space-y-4">
        {/* Header Baris */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            {event?.category?.name && (
              <Badge variant="outline" className="text-xs font-semibold gap-1">
                <Tag className="h-3 w-3" />
                <span>{event.category.name}</span>
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">
              Diterbitkan: {formatDate(ticket.issued_at)}
            </span>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Judul Event */}
        <div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground line-clamp-2">
            {event?.title || 'Kegiatan Kampus'}
          </h3>
        </div>

        {/* Waktu & Lokasi */}
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Tanggal
              </div>
              <div className="font-bold text-foreground">
                {formatDate(event?.event_date || '')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Waktu Pelaksanaan
              </div>
              <div className="font-bold text-foreground">
                {formatTime(event?.start_time)}
                {event?.end_time ? ` - ${formatTime(event.end_time)}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Lokasi / Tempat
              </div>
              <div className="font-bold text-foreground line-clamp-1">
                {event?.location || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Info Pemilik Tiket */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-foreground">
                {student?.full_name || 'Mahasiswa'}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <GraduationCap className="h-3 w-3" />
                <span>NIM: {student?.nim || '-'}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block uppercase font-medium">
              Tarif Pendaftaran
            </span>
            <span className="font-bold text-primary text-sm">
              {event?.price === 0 ? 'Gratis' : formatCurrency(event?.price ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Garis Potong / Perforated Stub Divider (khusus Desktop) */}
      <div className="hidden md:flex flex-col items-center justify-between py-2 relative">
        <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 -mt-3.5 border border-slate-200 dark:border-slate-800 shadow-inner z-10" />
        <div className="w-0.5 h-full border-r-2 border-dashed border-slate-300 dark:border-slate-700" />
        <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 -mb-3.5 border border-slate-200 dark:border-slate-800 shadow-inner z-10" />
      </div>

      {/* Divider Horizontal untuk Mobile */}
      <div className="md:hidden flex items-center justify-between px-2 relative">
        <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 -ml-3.5 border border-slate-200 dark:border-slate-800 shadow-inner z-10" />
        <div className="h-0.5 w-full border-b-2 border-dashed border-slate-300 dark:border-slate-700" />
        <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 -mr-3.5 border border-slate-200 dark:border-slate-800 shadow-inner z-10" />
      </div>

      {/* Kolom Kanan / Stub Tiket: Kode & QR Code */}
      <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 flex flex-col justify-between items-center text-center space-y-4">
        {/* Label Kode Tiket */}
        <div className="w-full">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
            KODE TIKET RESMI
          </span>
          <div className="mt-1 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="font-mono text-base font-extrabold tracking-wider text-primary select-all">
              {ticket.ticket_code}
            </span>
            <button
              onClick={handleCopyCode}
              title="Salin Kode Tiket"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* QR Code Pattern Visual Display */}
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-950 text-white dark:bg-white dark:text-slate-950 p-2 rounded-xl flex items-center justify-center">
            {/* Visual SVG QR graphic pattern */}
            <svg
              className="w-full h-full"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="5" height="5" x="3" y="3" rx="1" fill="currentColor" />
              <rect width="5" height="5" x="16" y="3" rx="1" fill="currentColor" />
              <rect width="5" height="5" x="3" y="16" rx="1" fill="currentColor" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-2" />
            </svg>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">
            Tunjukkan saat Check-in
          </span>
        </div>

        {/* Status Check-in Kehadiran */}
        <div className="w-full pt-1">
          {isCheckedIn ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Hadir ({formatTime(checkinData?.checked_in_at)})</span>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Belum Check-in</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
