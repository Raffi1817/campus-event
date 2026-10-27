'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cancelRegistrationAction } from '@/lib/actions/registrations'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface CancelRegistrationDialogProps {
  registrationId: string
  eventTitle: string
}

export function CancelRegistrationDialog({
  registrationId,
  eventTitle,
}: CancelRegistrationDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Kontrol tombol Escape dan kunci scroll latar belakang saat dialog aktif
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, isSubmitting])

  const handleCancel = async () => {
    setIsSubmitting(true)
    try {
      const res = await cancelRegistrationAction({ registrationId })
      if (!res.ok) {
        toast.error(res.error)
        return
      }

      toast.success('Pendaftaran event berhasil dibatalkan')
      setIsOpen(false)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat membatalkan pendaftaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs text-[#9B1C31] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 h-8 font-medium focus-visible:ring-2 focus-visible:ring-primary"
      >
        Batalkan Pendaftaran
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-registration-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsOpen(false)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            {/* Header Dialog */}
            <div className="flex items-start justify-between gap-3 border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FDE3E7] text-[#9B1C31] dark:bg-rose-950/60 dark:text-rose-400 border border-[#D1344B]/20 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="cancel-registration-dialog-title"
                    className="text-lg font-bold text-foreground"
                  >
                    Batalkan Pendaftaran
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Konfirmasi pembatalan keikutsertaan event
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsOpen(false)}
                disabled={isSubmitting}
                aria-label="Tutup dialog"
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin membatalkan pendaftaran untuk kegiatan berikut?
              </p>

              <div className="rounded-xl bg-muted/60 p-3.5 border font-semibold text-foreground text-sm">
                {eventTitle}
              </div>

              <div className="text-xs text-[#8A4B00] dark:text-amber-300 bg-[#FFEBD1]/60 dark:bg-amber-950/40 p-3 rounded-xl border border-[#E07A00]/25 dark:border-amber-800/50 leading-relaxed">
                Peringatan: Kuota event yang Anda pegang akan otomatis dikembalikan ke kuota umum dan aksi ini tidak dapat diurungkan.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-xs h-9 px-4"
              >
                Kembali
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-xs h-9 min-w-36 font-semibold gap-1.5 bg-[#D1344B] hover:bg-[#9B1C31] text-white focus-visible:ring-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <span>Ya, Batalkan Pendaftaran</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
