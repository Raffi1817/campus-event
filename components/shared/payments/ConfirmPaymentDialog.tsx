'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmPaymentAction } from '@/lib/actions/payments'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Banknote,
  Building2,
  Smartphone,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react'

interface ConfirmPaymentDialogProps {
  registrationId: string
  studentName: string
  eventTitle: string
  amount: number
  method?: string | null
  proofUrl?: string | null
}

export function ConfirmPaymentDialog({
  registrationId,
  studentName,
  eventTitle,
  amount,
  method = 'CASH',
  proofUrl = null,
}: ConfirmPaymentDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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

      toast.success(
        approve
          ? 'Pembayaran berhasil disetujui. Tiket resmi telah diterbitkan.'
          : 'Pembayaran ditolak. Notifikasi telah dikirim ke mahasiswa.'
      )

      setIsOpen(false)
      setActionType(null)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat memproses konfirmasi pembayaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMethodBadge = () => {
    switch (method) {
      case 'TRANSFER_BANK':
        return {
          label: 'Transfer Bank',
          icon: Building2,
          className: 'text-blue-700 dark:text-blue-400',
        }
      case 'E_WALLET':
        return {
          label: 'E-Wallet / QRIS',
          icon: Smartphone,
          className: 'text-emerald-700 dark:text-emerald-400',
        }
      case 'CASH':
      default:
        return {
          label: 'Tunai (Cash)',
          icon: Banknote,
          className: 'text-amber-700 dark:text-amber-400',
        }
    }
  }

  const methodInfo = getMethodBadge()
  const MethodIcon = methodInfo.icon

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
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
                      ? 'Konfirmasi Pembayaran Event'
                      : 'Tolak Pembayaran Event'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Verifikasi pembayaran peserta event kampus
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
                <span className="font-semibold text-foreground line-clamp-1 max-w-[220px] text-right">
                  {eventTitle}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Metode Pembayaran:</span>
                <span className={`inline-flex items-center gap-1 font-semibold ${methodInfo.className}`}>
                  <MethodIcon className="h-3.5 w-3.5" />
                  <span>{methodInfo.label}</span>
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Nominal Tagihan:</span>
                <span className="font-extrabold text-primary text-base">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>

            {/* Bukti Pembayaran (jika ada) */}
            {proofUrl && (
              <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>Bukti Transfer / E-Wallet Mahasiswa:</span>
                  </span>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Buka Penuh</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div
                  onClick={() => setIsPreviewOpen(true)}
                  className="relative h-44 w-full rounded-lg overflow-hidden border bg-background cursor-pointer hover:opacity-95 transition-opacity group"
                >
                  <Image
                    src={proofUrl}
                    alt="Bukti Pembayaran"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>Klik untuk memperbesar</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {actionType === 'APPROVE'
                ? proofUrl
                  ? 'Pastikan nominal bukti transfer/e-wallet telah sesuai dan dana telah masuk ke rekening/akun panitia. Setelah disetujui, tiket barcode resmi akan langsung diterbitkan untuk mahasiswa.'
                  : 'Pastikan uang tunai telah diterima dari mahasiswa. Setelah disetujui, tiket resmi akan langsung terbit.'
                : 'Menolak pembayaran akan mengubah status menjadi FAILED. Mahasiswa dapat mengunggah bukti baru atau memilih metode lain.'}
            </p>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-xs h-9"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant={actionType === 'APPROVE' ? 'default' : 'destructive'}
                onClick={() => handleConfirm(actionType === 'APPROVE')}
                disabled={isSubmitting}
                className={`text-xs h-9 min-w-32 font-semibold gap-1.5 ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : actionType === 'APPROVE' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Setujui Pembayaran</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Tolak Pembayaran</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Gambar Bukti */}
      {isPreviewOpen && proofUrl && (
        <div
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-[80vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-muted-foreground p-1"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={proofUrl}
                alt="Bukti Pembayaran Penuh"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
