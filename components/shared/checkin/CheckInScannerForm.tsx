'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkInAction, CheckInSuccessData } from '@/lib/actions/checkin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  UserCheck,
  Ticket,
  Clock,
  Sparkles,
} from 'lucide-react'

interface CheckInScannerFormProps {
  eventId: string
  eventTitle: string
  eventStatus: string
}

interface ScanResult extends CheckInSuccessData {
  timestamp: string
}

export function CheckInScannerForm({
  eventId,
  eventTitle,
  eventStatus,
}: CheckInScannerFormProps) {
  const router = useRouter()
  const [ticketCode, setTicketCode] = useState('')
  const [isPending, startTransition] = useTransition()
  const [lastSuccess, setLastSuccess] = useState<ScanResult | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEventOngoing = eventStatus === 'ONGOING'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedCode = ticketCode.trim().toUpperCase()
    if (!cleanedCode) {
      toast.error('Silakan masukkan kode tiket')
      inputRef.current?.focus()
      return
    }

    if (!isEventOngoing) {
      toast.error('Check-in hanya dapat dilakukan saat event berstatus ONGOING', {
        description: `Status event saat ini adalah "${eventStatus}". Silakan ubah status event ke ONGOING terlebih dahulu.`,
      })
      return
    }

    setLastError(null)

    startTransition(async () => {
      const res = await checkInAction({
        ticketCode: cleanedCode,
        eventId,
      })

      if (res.ok) {
        const timeNow = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())

        setLastSuccess({
          participant_name: res.data.participant_name,
          ticket_code: res.data.ticket_code,
          event_title: res.data.event_title,
          timestamp: `${timeNow} WIB`,
        })
        setLastError(null)
        setTicketCode('')

        toast.success(`Check-in Berhasil: ${res.data.participant_name}`, {
          description: `Tiket ${res.data.ticket_code} telah diverifikasi.`,
        })

        // Refresh halaman agar tabel riwayat kehadiran terbarukan secara instan
        router.refresh()

        // Fokuskan kembali input untuk memproses peserta berikutnya dengan cepat
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      } else {
        setLastError(res.error)
        setLastSuccess(null)
        toast.error('Check-in Ditolak', {
          description: res.error,
        })
        inputRef.current?.select()
      }
    })
  }

  const handleReset = () => {
    setTicketCode('')
    setLastError(null)
    setLastSuccess(null)
    inputRef.current?.focus()
  }

  return (
    <Card className="border shadow-sm overflow-hidden bg-card">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Verifikasi & Check-in Tiket</CardTitle>
              <CardDescription className="text-xs">
                Presensi untuk <span className="font-semibold text-foreground">{eventTitle}</span>. Masukkan kode tiket resmi mahasiswa.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Peringatan jika status belum ONGOING */}
        {!isEventOngoing && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-sm">
                Event Belum Berstatus ONGOING
              </span>
              <p className="leading-relaxed">
                Sesuai aturan bisnis sistem, check-in hanya diizinkan saat status kegiatan adalah{' '}
                <strong className="underline">ONGOING (Sedang Berlangsung)</strong>. Status saat ini masih{' '}
                <span className="font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  {eventStatus}
                </span>
                .
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Silakan buka menu <em>Kelola & Ubah</em> pada event ini untuk memajukan status menjadi ONGOING saat acara dimulai.
              </p>
            </div>
          </div>
        )}

        {/* Form Input Kode Tiket */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="ticketCodeInput"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
            >
              Kode Tiket Peserta
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Ticket className="h-4 w-4" />
              </div>
              <Input
                id="ticketCodeInput"
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                placeholder="CE-XXXXXXXXXX"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                disabled={isPending || !isEventOngoing}
                className="pl-10 pr-10 h-12 text-base sm:text-lg font-mono font-bold tracking-wider uppercase bg-background"
                autoFocus
              />
              {ticketCode && (
                <button
                  type="button"
                  onClick={() => setTicketCode('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              disabled={isPending || !ticketCode.trim() || !isEventOngoing}
              className="flex-1 h-11 text-sm font-bold gap-2 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Proses Check-in</span>
                </>
              )}
            </Button>

            {(lastSuccess || lastError || ticketCode) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isPending}
                className="h-11 px-3 text-xs gap-1.5"
                title="Bersihkan status verifikasi"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </form>

        {/* Kartu Feedback Sukses */}
        {lastSuccess && (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in-50 duration-300">
            <div className="flex items-start justify-between gap-2 border-b border-emerald-200 dark:border-emerald-900 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Check-in Berhasil</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lastSuccess.timestamp}</span>
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 block tracking-wider">
                Nama Peserta
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-foreground">
                {lastSuccess.participant_name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Kode Tiket
                </span>
                <span className="font-mono font-bold text-primary text-sm">
                  {lastSuccess.ticket_code}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Status Tiket
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>USED (Hadir)</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Kartu Feedback Gagal */}
        {lastError && (
          <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-50/80 dark:bg-rose-950/30 p-4 sm:p-5 shadow-sm space-y-2 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm sm:text-base">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Verifikasi Tiket Ditolak</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
              {lastError}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
