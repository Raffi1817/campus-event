'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { payRegistrationAction } from '@/lib/actions/payments'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  Upload,
  Copy,
  QrCode,
  Image as ImageIcon,
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<MethodType>('TRANSFER_BANK')
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Salin nomor rekening/nomor e-wallet ke clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} berhasil disalin ke clipboard`)
  }

  // Upload bukti bayar ke Supabase Storage (bucket: payment-proofs)
  const handleFileUpload = async (file: File) => {
    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WebP')
      return
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2 MB')
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('Sesi login telah berakhir. Silakan masuk kembali.')
        return
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30)
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          toast.error(
            'Bucket penyimpanan belum diaktifkan. Jalankan migrasi 003_payment_proof.sql di Supabase.'
          )
        } else {
          toast.error(`Gagal mengunggah bukti: ${uploadError.message}`)
        }
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('payment-proofs').getPublicUrl(filePath)

      setProofUrl(publicUrl)
      toast.success('Bukti pembayaran berhasil diunggah')
    } catch {
      toast.error('Terjadi gangguan saat memproses unggahan bukti')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePay = async () => {
    if (selectedMethod !== 'CASH' && !proofUrl) {
      toast.error('Silakan unggah bukti pembayaran terlebih dahulu.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await payRegistrationAction({
        registrationId,
        method: selectedMethod,
        proofUrl: selectedMethod !== 'CASH' ? proofUrl : null,
      })

      if (!res.ok) {
        toast.error(res.error)
        return
      }

      if (res.data.status === 'PENDING') {
        toast.success(
          selectedMethod === 'CASH'
            ? 'Metode tunai dipilih. Silakan bayar ke panitia di lokasi acara.'
            : 'Bukti pembayaran terkirim! Menunggu verifikasi dari panitia.'
        )
      } else {
        toast.success('Pembayaran berhasil! Tiket Anda telah terbit.')
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
      title: 'Transfer Bank',
      desc: 'Transfer ke rekening panitia & upload bukti screenshot / struk transfer.',
      badge: 'Verifikasi Panitia',
      icon: Building2,
    },
    {
      id: 'E_WALLET',
      title: 'E-Wallet / QRIS',
      desc: 'Scan QRIS atau transfer via GoPay, OVO, Dana & upload bukti screenshot.',
      badge: 'Verifikasi Panitia',
      icon: Smartphone,
    },
    {
      id: 'CASH',
      title: 'Tunai (Cash di Lokasi)',
      desc: 'Bayar langsung ke meja panitia di lokasi acara sebelum event dimulai.',
      badge: 'Bayar di Lokasi',
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
                disabled={isSubmitting || isUploading}
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
                <span>Simulasi Kampus</span>
              </div>
            </div>

            {/* Pilihan Metode Bayar */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                1. Pilih Metode Pembayaran
              </label>

              <div className="space-y-2.5">
                {paymentMethods.map((m) => {
                  const Icon = m.icon
                  const isSelected = selectedMethod === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMethod(m.id)
                      }}
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
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
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

            {/* Instruksi Tujuan Pembayaran */}
            {selectedMethod === 'TRANSFER_BANK' && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <Building2 className="h-4 w-4" />
                  <span>Rekening Tujuan Pembayaran Panitia:</span>
                </div>
                <div className="bg-background rounded-lg p-3 border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Bank Mandiri
                      </span>
                      <strong className="text-foreground font-mono text-sm tracking-wide">
                        137-00-1234567-8
                      </strong>
                      <span className="text-muted-foreground block text-[11px]">
                        a.n. BEM CampusEvent
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy('1370012345678', 'Nomor rekening')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Salin</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'E_WALLET' && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <QrCode className="h-4 w-4" />
                  <span>QRIS & Nomor E-Wallet Panitia:</span>
                </div>
                <div className="bg-background rounded-lg p-3 border space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        GoPay / OVO / Dana
                      </span>
                      <strong className="text-foreground font-mono text-sm tracking-wide">
                        0812-3456-7890
                      </strong>
                      <span className="text-muted-foreground block text-[11px]">
                        a.n. Bendahara CampusEvent
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy('081234567890', 'Nomor E-Wallet')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Salin</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Unggah Bukti Bayar (Wajib untuk Transfer Bank & E-Wallet) */}
            {selectedMethod !== 'CASH' && (
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>2. Unggah Bukti Pembayaran</span>
                  <span className="text-[11px] text-rose-500 font-semibold normal-case">
                    *Wajib
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileUpload(f)
                  }}
                />

                {proofUrl ? (
                  <div className="relative rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-background shrink-0">
                      <Image
                        src={proofUrl}
                        alt="Bukti Pembayaran"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Bukti Siap Dikirim</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        Klik &quot;Ganti&quot; jika ingin memilih file lain.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-7 px-2.5 shrink-0"
                    >
                      Ganti
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                      isUploading
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/30'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs font-medium text-foreground">
                          Sedang mengunggah bukti gambar...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">
                            Klik untuk memilih file tangkapan layar / struk transfer
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Format JPG, PNG, atau WebP (Maksimal 2 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info Catatan */}
            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>
                {selectedMethod === 'CASH'
                  ? 'Catatan: Pembayaran tunai akan berstatus Pending sampai panitia mengonfirmasi penerimaan uang di meja registrasi lokasi acara.'
                  : 'Catatan: Pembayaran akan berstatus Pending menunggu verifikasi bukti oleh panitia event. Tiket resmi terbit otomatis setelah disetujui.'}
              </span>
            </div>

            {/* Footer Aksi */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting || isUploading}
                className="text-xs h-9"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handlePay}
                disabled={isSubmitting || isUploading || (selectedMethod !== 'CASH' && !proofUrl)}
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
                    <span>
                      {selectedMethod === 'CASH'
                        ? 'Konfirmasi Bayar Tunai'
                        : 'Kirim Bukti Pembayaran'}
                    </span>
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
