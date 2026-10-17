'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { payRegistrationAction } from '@/lib/actions/payments'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  Loader2,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

interface PaymentDialogProps {
  registrationId: string
  eventTitle: string
  amount: number
  isRetry?: boolean
}

type MethodType = 'TRANSFER_BANK' | 'E_WALLET' | 'CASH'

export function PaymentDialog({
  registrationId,
  eventTitle,
  amount,
  isRetry = false,
}: PaymentDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<MethodType>('TRANSFER_BANK')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePay = async () => {
    setIsSubmitting(true)
    try {
      const res = await payRegistrationAction({
        registrationId,
        method: selectedMethod,
      })

      if (!res.ok) {
        toast.error(res.error)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat memproses pembayaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentMethods: {
    id: MethodType
    title: string
    desc: string
    badge: string
    icon: typeof Building2
  }[] = [
    {
      id: 'TRANSFER_BANK',
      title: 'Transfer Bank (Virtual Account)',
      desc: 'Simulasi otomatis lunas instan via BCA / Mandiri / BNI Virtual Account.',
      badge: 'Instan Lunas',
      icon: Building2,
    },
    {
      id: 'E_WALLET',
      title: 'E-Wallet / QRIS',
      desc: 'Simulasi instan via Gopay, OVO, Dana, atau QRIS Mahasiswa.',
      badge: 'Instan Lunas',
      icon: Smartphone,
    },
    {
      id: 'CASH',
      title: 'Tunai (Cash di Lokasi)',
      desc: 'Bayar langsung ke meja registrasi panitia. Status Pending hingga diverifikasi panitia.',
      badge: 'Perlu Konfirmasi',
      icon: Banknote,
    },
  ]

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs h-8 gap-1.5 font-semibold shadow-xs"
        variant={isRetry ? 'destructive' : 'default'}
      >
        <CreditCard className="h-3.5 w-3.5" />
        <span>{isRetry ? 'Bayar Ulang' : 'Bayar Sekarang'}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>{isRetry ? 'Bayar Ulang Pendaftaran' : 'Pembayaran Event'}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  Event: <strong className="text-foreground">{eventTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Pembayaran Card */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Total Tagihan
                </span>
                <div className="text-2xl font-black text-primary mt-0.5">
                  {formatCurrency(amount)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2.5 py-1.5 rounded-lg border shadow-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Simulasi Aman</span>
              </div>
            </div>

            {/* Pilihan Metode Bayar */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Pilih Metode Pembayaran
              </label>

              <div className="space-y-2.5">
                {paymentMethods.map((m) => {
                  const Icon = m.icon
                  const isSelected = selectedMethod === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`relative flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-border hover:bg-muted/40 hover:border-muted-foreground/30'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {m.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              m.id === 'CASH'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {m.desc}
                        </p>
                      </div>
                      <div className="absolute top-4 right-3.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info Catatan */}
            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>
                {selectedMethod === 'CASH'
                  ? 'Catatan: Pembayaran tunai akan berstatus Pending sampai panitia mengonfirmasi penerimaan uang di lokasi acara.'
                  : 'Catatan: Pembayaran akan disimulasikan lunas langsung. Tiket resmi CE-XXXXXXXXXX otomatis terbit saat berhasil.'}
              </span>
            </div>

            {/* Footer Aksi */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t">
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
                onClick={handlePay}
                disabled={isSubmitting}
                className="text-xs h-9 gap-2 min-w-36 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Konfirmasi Bayar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
