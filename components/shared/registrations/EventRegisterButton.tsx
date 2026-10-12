'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { registerEventAction } from '@/lib/actions/registrations'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ticket, CheckCircle2, Loader2, AlertCircle, ArrowRight, X } from 'lucide-react'

interface EventRegisterButtonProps {
  eventId: string
  eventTitle: string
  isFree: boolean
  price: number
  isRegistered: boolean
  remainingQuota: number
}

export function EventRegisterButton({
  eventId,
  eventTitle,
  isFree,
  price,
  isRegistered: initialIsRegistered,
  remainingQuota,
}: EventRegisterButtonProps) {
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Jika mahasiswa sudah terdaftar
  if (isRegistered) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
        <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Anda Sudah Terdaftar</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pendaftaran Anda telah tercatat di sistem. Anda dapat memantau status pembayaran dan tiket di riwayat pendaftaran.
        </p>
        <Link href="/my/registrations" className="block">
          <Button variant="outline" className="w-full gap-2 text-xs border-emerald-300 dark:border-emerald-800">
            <span>Lihat Pendaftaran Saya</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  // Jika kuota sudah habis
  if (remainingQuota <= 0) {
    return (
      <div className="space-y-2">
        <Button className="w-full font-semibold" size="lg" disabled variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Kuota Habis</span>
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          Mohon maaf, kuota peserta untuk event ini sudah penuh.
        </p>
      </div>
    )
  }

  const handleRegister = async () => {
    setIsSubmitting(true)
    try {
      const res = await registerEventAction({ eventId })
      if (!res.ok) {
        toast.error(res.error)
        return
      }

      setIsRegistered(true)
      setIsModalOpen(false)
      if (isFree) {
        toast.success('Pendaftaran berhasil! Event gratis, tiket langsung diterbitkan.')
      } else {
        toast.success('Pendaftaran berhasil! Silakan cek menu Pendaftaran Saya untuk instruksi pembayaran.')
      }
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat memproses pendaftaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
          size="lg"
        >
          <Ticket className="h-4 w-4" />
          <span>Daftar Event Sekarang</span>
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          {isFree ? 'Event ini gratis tanpa biaya pendaftaran.' : 'Satu kuota akan langsung dialokasikan untuk Anda.'}
        </p>
      </div>

      {/* Modal Konfirmasi Pendaftaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <Ticket className="h-5 w-5" />
                <span>Konfirmasi Pendaftaran</span>
              </div>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Apakah Anda yakin ingin mendaftar ke kegiatan berikut?
              </p>

              <div className="rounded-xl bg-muted/60 p-4 space-y-2 border">
                <div className="font-semibold text-foreground text-base">{eventTitle}</div>
                <div className="flex justify-between items-center text-xs pt-1 border-t">
                  <span className="text-muted-foreground">Biaya Partisipasi:</span>
                  <span className="font-bold text-primary">
                    {isFree ? 'Gratis' : formatCurrency(price)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  {isFree
                    ? 'Event ini tidak dipungut biaya. Tiket elektronik Anda akan otomatis aktif setelah konfirmasi.'
                    : 'Pendaftaran akan memegang 1 kuota. Anda dapat membatalkan sebelum pembayaran lunas jika berhalangan hadir.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
              <Button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <span>Ya, Konfirmasi Daftar</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
