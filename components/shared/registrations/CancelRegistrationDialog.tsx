'use client'

import { useState } from 'react'
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

  const handleCancel = async () => {
    setIsSubmitting(true)
    try {
      const res = await cancelRegistrationAction({ registrationId })
      if (!res.ok) {
        toast.error(res.error)
        return
      }

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
        className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
      >
        Batalkan Pendaftaran
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                <AlertTriangle className="h-5 w-5" />
                <span>Batalkan Pendaftaran</span>
              </div>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Apakah Anda yakin ingin membatalkan pendaftaran untuk event:
              </p>

              <div className="rounded-xl bg-muted/60 p-3.5 border font-semibold text-foreground">
                {eventTitle}
              </div>

              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
                Peringatan: Kuota event yang Anda pegang akan otomatis dikembalikan ke kuota umum. Aksi ini tidak dapat diurungkan.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
