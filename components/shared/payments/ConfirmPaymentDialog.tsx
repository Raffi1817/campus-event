'use client'

import { useState, useEffect } from 'react'
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
  ShieldCheck,
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

  // Tutup dialog dengan tombol Escape dan kendalikan scroll body
  useEffect(() => {
    if (!isOpen && !isPreviewOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewOpen) {
          setIsPreviewOpen(false)
        } else if (!isSubmitting) {
          setIsOpen(false)
          setActionType(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, isPreviewOpen, isSubmitting])

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
          className:
            'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40',
        }
      case 'E_WALLET':
        return {
          label: 'E-Wallet / QRIS',
          icon: Smartphone,
          className:
            'text-[#0A5F4D] dark:text-emerald-400 bg-[#DDF5EE] dark:bg-emerald-950/40 border border-[#0E8A6F]/20 dark:border-emerald-800/40',
        }
      case 'CASH':
      default:
        return {
          label: 'Tunai (Cash di Lokasi)',
          icon: Banknote,
          className:
            'text-[#8A4B00] dark:text-amber-400 bg-[#FFEBD1] dark:bg-amber-950/40 border border-[#E07A00]/20 dark:border-amber-800/40',
        }
    }
  }

  const methodInfo = getMethodBadge()
  const MethodIcon = methodInfo.icon

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setActionType('APPROVE')
            setIsOpen(true)
          }}
          className="text-xs h-7 px-2.5 text-[#0A5F4D] dark:text-emerald-400 border-[#0E8A6F]/30 dark:border-emerald-800 hover:bg-[#0E8A6F] hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white gap-1 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Setujui</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setActionType('REJECT')
            setIsOpen(true)
          }}
          className="text-xs h-7 px-2.5 text-[#9B1C31] dark:text-rose-400 border-[#D1344B]/30 dark:border-rose-800 hover:bg-[#D1344B] hover:text-white dark:hover:bg-rose-600 dark:hover:text-white gap-1 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Tolak</span>
        </Button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-payment-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsOpen(false)
              setActionType(null)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Header Dialog */}
            <div className="flex items-start justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-3">
                {actionType === 'APPROVE' ? (
                  <div className="p-2.5 rounded-xl bg-[#DDF5EE] text-[#0A5F4D] dark:bg-emerald-950/60 dark:text-emerald-400 border border-[#0E8A6F]/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#FDE3E7] text-[#9B1C31] dark:bg-rose-950/60 dark:text-rose-400 border border-[#D1344B]/20 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3
                    id="confirm-payment-dialog-title"
                    className="text-lg font-bold tracking-tight text-foreground"
                  >
                    {actionType === 'APPROVE'
                      ? 'Konfirmasi Persetujuan Pembayaran'
                      : 'Tolak Pembayaran Mahasiswa'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verifikasi pembayaran peserta event kampus
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setActionType(null)
                }}
                disabled={isSubmitting}
                aria-label="Tutup dialog konfirmasi"
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Detail Peserta & Tagihan Card */}
            <div className="rounded-xl bg-muted/40 p-4 border space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nama Mahasiswa:</span>
                <span className="font-bold text-foreground text-sm">{studentName}</span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-muted-foreground shrink-0">Kegiatan Event:</span>
                <span className="font-semibold text-foreground line-clamp-1 text-right">
                  {eventTitle}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Metode Pembayaran:</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-md text-[11px] ${methodInfo.className}`}
                >
                  <MethodIcon className="h-3.5 w-3.5" />
                  <span>{methodInfo.label}</span>
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Nominal Tagihan:</span>
                <span className="font-black text-primary text-base tracking-tight">
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
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Buka Tab Baru</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div
                  onClick={() => setIsPreviewOpen(true)}
                  className="relative h-44 w-full rounded-lg overflow-hidden border bg-background cursor-pointer hover:opacity-95 transition-all group shadow-xs"
                  title="Klik untuk memperbesar gambar bukti"
                >
                  <Image
                    src={proofUrl}
                    alt="Bukti Pembayaran"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>Klik untuk memperbesar</span>
                  </div>
                </div>
              </div>
            )}

            {/* Deskripsi & Konsekuensi Aksi */}
            <div
              className={`rounded-xl p-2.5 px-3 text-xs flex items-center gap-2 border ${
                actionType === 'APPROVE'
                  ? 'bg-[#DDF5EE]/50 text-[#0A5F4D] border-[#0E8A6F]/20 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'bg-[#FDE3E7]/50 text-[#9B1C31] border-[#D1344B]/20 dark:bg-rose-950/30 dark:text-rose-300'
              }`}
            >
              {actionType === 'APPROVE' ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#0E8A6F] dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#D1344B] dark:text-rose-400" />
              )}
              <span className="leading-normal">
                {actionType === 'APPROVE'
                  ? 'Tiket barcode resmi akan langsung terbit otomatis setelah disetujui.'
                  : 'Status pendaftaran akan ditolak dan mahasiswa dapat membayar ulang.'}
              </span>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  setActionType(null)
                }}
                disabled={isSubmitting}
                className="text-xs h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleConfirm(actionType === 'APPROVE')}
                disabled={isSubmitting}
                className={`text-xs h-9 min-w-36 font-semibold gap-1.5 shadow-xs focus-visible:ring-2 ${
                  actionType === 'APPROVE'
                    ? 'bg-[#0E8A6F] hover:bg-[#0A5F4D] text-white focus-visible:ring-[#0E8A6F]'
                    : 'bg-[#D1344B] hover:bg-[#9B1C31] text-white focus-visible:ring-[#D1344B]'
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
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau Bukti Pembayaran"
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center justify-center cursor-default"
          >
            <div className="w-full flex items-center justify-between pb-2 text-white text-xs">
              <span className="font-medium truncate max-w-xs sm:max-w-md">
                Bukti Pembayaran: {studentName} ({eventTitle})
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Tutup pratinjau"
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative w-full h-[75vh] rounded-xl overflow-hidden border border-white/20 bg-black/60 shadow-2xl">
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
