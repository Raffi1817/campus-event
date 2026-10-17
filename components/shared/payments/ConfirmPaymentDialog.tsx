'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmPaymentAction } from '@/lib/actions/payments'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Banknote,
  X,
} from 'lucide-react'

interface ConfirmPaymentDialogProps {
  registrationId: string
  studentName: string
  eventTitle: string
  amount: number
}

export function ConfirmPaymentDialog({
  registrationId,
  studentName,
  eventTitle,
  amount,
}: ConfirmPaymentDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async (approve: boolean) => {
    setIsSubmitting(true)
    try {
      const res = await confirmPaymentAction({
        registrationId,
        approve,
      })

      if (!res.ok) {
        toast.error(res.error)
        return
      }

      setIsOpen(false)
      setActionType(null)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat memproses konfirmasi pembayaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setActionType('APPROVE')
            setIsOpen(true)
          }}
          className="text-xs h-7 px-2.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1 font-semibold"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Setujui</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setActionType('REJECT')
            setIsOpen(true)
          }}
          className="text-xs h-7 px-2.5 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 font-semibold"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Tolak</span>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-2">
                {actionType === 'APPROVE' ? (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {actionType === 'APPROVE'
                      ? 'Konfirmasi Pembayaran Cash'
                      : 'Tolak Pembayaran Cash'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Verifikasi pembayaran tunai di meja registrasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Detail Peserta & Tagihan */}
            <div className="rounded-xl bg-muted/40 p-4 border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Mahasiswa:</span>
                <span className="font-bold text-foreground">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event:</span>
                <span className="font-semibold text-foreground line-clamp-1 max-w-[200px] text-right">
                  {eventTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <Banknote className="h-3.5 w-3.5" />
                  <span>Tunai (Cash)</span>
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Nominal Uang:</span>
                <span className="font-extrabold text-primary text-base">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {actionType === 'APPROVE'
                ? 'Pastikan uang tunai sejumlah di atas telah diterima dari mahasiswa. Setelah disetujui, tiket resmi akan langsung terbit.'
                : 'Menolak pembayaran akan mengubah status menjadi FAILED. Mahasiswa dapat memilih metode pembayaran kembali jika ingin mencoba lagi.'}
            </p>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-xs h-8"
              >
                Batal
              </Button>
              {actionType === 'APPROVE' ? (
                <Button
                  size="sm"
                  onClick={() => handleConfirm(true)}
                  disabled={isSubmitting}
                  className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Ya, Setujui Lunas</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleConfirm(false)}
                  disabled={isSubmitting}
                  className="text-xs h-8 gap-1.5 font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Ya, Tolak Pembayaran</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
