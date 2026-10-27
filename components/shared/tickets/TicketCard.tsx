'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { TicketWithDetails } from '@/types/tickets'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
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
  Maximize2,
  X,
  QrCode,
} from 'lucide-react'

interface TicketCardProps {
  ticket: TicketWithDetails
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [copied, setCopied] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  const reg = ticket.registration
  const event = reg?.event
  const student = reg?.student

  const checkinData = Array.isArray(ticket.checkins)
    ? ticket.checkins[0]
    : ticket.checkins
  const isCheckedIn = Boolean(checkinData)

  // Kontrol tombol Escape dan kunci scroll latar belakang saat modal zoom terbuka
  useEffect(() => {
    if (!isZoomOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isZoomOpen])

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticket_code)
      setCopied(true)
      toast.success(`Kode tiket ${ticket.ticket_code} berhasil disalin`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin kode tiket')
    }
  }, [ticket.ticket_code])

  // Badge Status Tiket Resmi sesuai PALETTE.md
  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FFF3C7] text-[#6B4E00] border border-[#F5B800]/40 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#F5B800] shrink-0" />
            <span>Tiket Aktif</span>
          </span>
        )
      case 'USED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#ECEEF5] text-[#4A5068] border border-[#8087A2]/30 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#8087A2] shrink-0" />
            <span>Telah Digunakan (USED)</span>
          </span>
        )
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FDE3E7] text-[#9B1C31] border border-[#D1344B]/30 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-xs">
            <XCircle className="h-3.5 w-3.5 text-[#D1344B] shrink-0" />
            <span>Dibatalkan</span>
          </span>
        )
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E1E4EE] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row">
      {/* Kolom Kiri: Detail Event & Identitas Mahasiswa */}
      <div className="flex-1 p-5 sm:p-6 space-y-4">
        {/* Header Baris */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E1E4EE] dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {event?.category?.name && (
              <Badge variant="outline" className="text-xs font-semibold gap-1">
                <Tag className="h-3 w-3 text-primary" />
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
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Tanggal
              </div>
              <div className="font-bold text-foreground">
                {formatDate(event?.event_date || '')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Waktu Pelaksanaan
              </div>
              <div className="font-bold text-foreground">
                {formatTime(event?.start_time)}
                {event?.end_time ? ` - ${formatTime(event.end_time)} WIB` : ' WIB'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Lokasi / Tempat
              </div>
              <div className="font-bold text-foreground line-clamp-1">
                {event?.location || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Info Pemilik Tiket */}
        <div className="pt-2 border-t border-[#E1E4EE] dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
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
            <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
              Tarif Pendaftaran
            </span>
            <span className="font-black text-primary text-sm tracking-tight">
              {event?.price === 0 ? 'Gratis' : formatCurrency(event?.price ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Garis Potong / Perforated Stub Divider (Desktop) */}
      <div className="hidden md:flex flex-col items-center justify-between py-2 relative">
        <div className="w-5 h-5 rounded-full bg-[#F6F7FB] dark:bg-slate-950 -mt-3.5 border border-[#E1E4EE] dark:border-slate-800 shadow-inner z-10" />
        <div className="w-0.5 h-full border-r-2 border-dashed border-slate-300 dark:border-slate-700" />
        <div className="w-5 h-5 rounded-full bg-[#F6F7FB] dark:bg-slate-950 -mb-3.5 border border-[#E1E4EE] dark:border-slate-800 shadow-inner z-10" />
      </div>

      {/* Divider Horizontal untuk Mobile */}
      <div className="md:hidden flex items-center justify-between px-2 relative">
        <div className="w-5 h-5 rounded-full bg-[#F6F7FB] dark:bg-slate-950 -ml-3.5 border border-[#E1E4EE] dark:border-slate-800 shadow-inner z-10" />
        <div className="h-0.5 w-full border-b-2 border-dashed border-slate-300 dark:border-slate-700" />
        <div className="w-5 h-5 rounded-full bg-[#F6F7FB] dark:bg-slate-950 -mr-3.5 border border-[#E1E4EE] dark:border-slate-800 shadow-inner z-10" />
      </div>

      {/* Kolom Kanan / Stub Tiket: Kode & QR Code */}
      <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 flex flex-col justify-between items-center text-center space-y-4">
        {/* Label Kode Tiket */}
        <div className="w-full">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            KODE TIKET RESMI
          </span>
          <div className="mt-1.5 flex items-center justify-between gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-[#E1E4EE] dark:border-slate-700 shadow-xs">
            <span className="font-mono text-base font-black tracking-wider text-primary select-all">
              {ticket.ticket_code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              title="Salin Kode Tiket"
              aria-label="Salin Kode Tiket"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#0E8A6F] dark:text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* QR Code Asli & Tombol Perbesar */}
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-[#E1E4EE] dark:border-slate-700 shadow-xs flex flex-col items-center space-y-2">
          <div
            tabIndex={0}
            role="button"
            aria-label="Klik untuk memperbesar QR Code"
            onClick={() => setIsZoomOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsZoomOpen(true)
              }
            }}
            className="relative group cursor-pointer p-2 bg-white rounded-xl border border-slate-100 shadow-2xs transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
            title="Klik untuk memperbesar QR Code"
          >
            <QRCodeSVG
              value={ticket.ticket_code}
              size={96}
              level="M"
              className={ticket.status !== 'ACTIVE' ? 'opacity-30 grayscale' : ''}
            />
            {ticket.status === 'USED' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
                <span className="text-[10px] font-bold text-white bg-slate-600 px-2 py-0.5 rounded-full shadow-xs">
                  USED
                </span>
              </div>
            )}
            {ticket.status === 'CANCELLED' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
                <span className="text-[10px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded-full shadow-xs">
                  CANCELLED
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Perbesar QR</span>
          </button>
        </div>

        {/* Status Check-in Kehadiran sesuai PALETTE.md */}
        <div className="w-full pt-1">
          {isCheckedIn ? (
            <div className="bg-[#DDF5EE] border border-[#0E8A6F]/25 rounded-xl p-2.5 text-xs text-[#0A5F4D] dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300 flex items-center justify-center gap-1.5 font-bold shadow-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0E8A6F] dark:text-emerald-400" />
              <span>Hadir ({formatTime(checkinData?.checked_in_at)})</span>
            </div>
          ) : (
            <div className="bg-[#ECEEF5] border border-[#8087A2]/25 rounded-xl p-2.5 text-xs text-[#4A5068] dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 font-medium shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#8087A2]" />
              <span>Belum Hadir</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Zoom QR Code Layar Penuh */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-qr-zoom-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsZoomOpen(false)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <span
                id="ticket-qr-zoom-title"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <QrCode className="h-4 w-4 text-primary" />
                <span>QR Code Tiket Peserta</span>
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                aria-label="Tutup pratinjau QR Code"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-base text-foreground line-clamp-1">
                {event?.title || 'Campus Event'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {student?.full_name} {student?.nim ? `(${student.nim})` : ''}
              </p>
            </div>

            {/* Container QR Code Besar */}
            <div className="flex justify-center py-2">
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                <QRCodeSVG
                  value={ticket.ticket_code}
                  size={210}
                  level="H"
                  className={ticket.status !== 'ACTIVE' ? 'opacity-40 grayscale' : ''}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-lg font-black tracking-widest text-primary">
                  {ticket.ticket_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Salin Kode"
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[#0E8A6F] dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tunjukkan QR Code ini kepada panitia saat registrasi di lokasi acara.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
