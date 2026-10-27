'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  Check,
  QrCode,
  Eye,
  Trash2,
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
  const [proofFileName, setProofFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Tutup modal dengan tombol Escape dan kontrol scroll body
  useEffect(() => {
    if (!isOpen && !isPreviewOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreviewOpen) {
          setIsPreviewOpen(false)
        } else if (!isSubmitting && !isUploading) {
          setIsOpen(false)
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
  }, [isOpen, isPreviewOpen, isSubmitting, isUploading])

  // Salin ke clipboard dengan umpan balik visual instan
  const handleCopy = useCallback((text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} berhasil disalin ke clipboard`)
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr))
    }, 2000)
  }, [])

  // Validasi dan unggah file bukti bayar
  const handleFileUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WebP')
      return
    }

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
      setProofFileName(file.name)
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

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isUploading) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (isUploading) return

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileUpload(droppedFile)
    }
  }

  const handleRemoveProof = () => {
    setProofUrl(null)
    setProofFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
            ? 'Metode tunai dipilih. Silakan bayar ke panitia di meja registrasi acara.'
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
    badgeClass: string
    icon: typeof Building2
  }[] = [
    {
      id: 'TRANSFER_BANK',
      title: 'Transfer Bank',
      desc: 'Transfer ke rekening panitia & unggah bukti tangkapan layar atau struk transfer.',
      badge: 'Verifikasi Panitia',
      badgeClass:
        'bg-[#FFEBD1] text-[#8A4B00] border border-[#E07A00]/25 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40',
      icon: Building2,
    },
    {
      id: 'E_WALLET',
      title: 'E-Wallet / QRIS',
      desc: 'Kirim via GoPay, OVO, Dana atau scan QRIS & unggah bukti tangkapan layar transaksi.',
      badge: 'Verifikasi Panitia',
      badgeClass:
        'bg-[#FFEBD1] text-[#8A4B00] border border-[#E07A00]/25 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40',
      icon: Smartphone,
    },
    {
      id: 'CASH',
      title: 'Tunai (Cash di Lokasi)',
      desc: 'Bayar langsung dengan uang tunai di meja panitia saat registrasi ulang lokasi acara.',
      badge: 'Bayar di Lokasi',
      badgeClass:
        'bg-[#DDF5EE] text-[#0A5F4D] border border-[#0E8A6F]/25 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40',
      icon: Banknote,
    },
  ]

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs h-8 gap-1.5 font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
        variant={isRetry ? 'destructive' : 'default'}
      >
        <CreditCard className="h-3.5 w-3.5" />
        <span>{isRetry ? 'Bayar Ulang' : 'Bayar Sekarang'}</span>
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting && !isUploading) {
              setIsOpen(false)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Header Dialog */}
            <div className="flex items-start justify-between gap-3 border-b pb-4">
              <div>
                <h3
                  id="payment-dialog-title"
                  className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
                >
                  <CreditCard className="h-5 w-5 text-primary shrink-0" />
                  <span>{isRetry ? 'Bayar Ulang Pendaftaran' : 'Pembayaran Event'}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  Event: <strong className="text-foreground">{eventTitle}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting || isUploading}
                aria-label="Tutup dialog pembayaran"
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Pembayaran Card */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                  Total Tagihan
                </span>
                <div className="text-2xl font-black text-primary mt-0.5 tracking-tight">
                  {formatCurrency(amount)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/90 px-3 py-1.5 rounded-lg border shadow-xs">
                <ShieldCheck className="h-4 w-4 text-[#0E8A6F] dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-foreground text-[11px]">Simulasi Kampus</span>
              </div>
            </div>

            {/* Pilihan Metode Bayar (Accessible Radio Group) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                1. Pilih Metode Pembayaran
              </label>

              <div
                role="radiogroup"
                aria-label="Pilih metode pembayaran"
                className="space-y-2.5"
              >
                {paymentMethods.map((m) => {
                  const Icon = m.icon
                  const isSelected = selectedMethod === m.id
                  return (
                    <div
                      key={m.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedMethod(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedMethod(m.id)
                        }
                      }}
                      className={`relative flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-border hover:bg-muted/40 hover:border-muted-foreground/30'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">
                            {m.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeClass}`}
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
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Instruksi Tujuan Pembayaran */}
            {selectedMethod === 'TRANSFER_BANK' && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950 dark:text-blue-200">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>Rekening Tujuan Transfer Panitia:</span>
                </div>
                <div className="bg-background rounded-lg p-3.5 border shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                        Bank Mandiri
                      </span>
                      <strong className="text-foreground font-mono text-base tracking-wide block mt-0.5">
                        137-00-1234567-8
                      </strong>
                      <span className="text-muted-foreground block text-[11px] mt-0.5">
                        a.n. BEM CampusEvent
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy('1370012345678', 'Nomor rekening Mandiri', 'mandiri')
                      }
                      className="h-8 text-xs gap-1.5 font-semibold px-3 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copiedKey === 'mandiri' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#0E8A6F] dark:text-emerald-400" />
                          <span className="text-[#0A5F4D] dark:text-emerald-300">
                            Tersalin!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin No. Rek</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'E_WALLET' && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  <QrCode className="h-4 w-4 shrink-0 text-[#0E8A6F] dark:text-emerald-400" />
                  <span>QRIS & Nomor E-Wallet Panitia:</span>
                </div>
                <div className="bg-background rounded-lg p-3.5 border shadow-xs space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                        GoPay / OVO / Dana
                      </span>
                      <strong className="text-foreground font-mono text-base tracking-wide block mt-0.5">
                        0812-3456-7890
                      </strong>
                      <span className="text-muted-foreground block text-[11px] mt-0.5">
                        a.n. Bendahara CampusEvent
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy('081234567890', 'Nomor E-Wallet', 'ewallet')
                      }
                      className="h-8 text-xs gap-1.5 font-semibold px-3 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copiedKey === 'ewallet' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#0E8A6F] dark:text-emerald-400" />
                          <span className="text-[#0A5F4D] dark:text-emerald-300">
                            Tersalin!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin No. HP</span>
                        </>
                      )}
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
                  <div className="relative rounded-xl border border-emerald-300 dark:border-emerald-800 bg-[#DDF5EE]/30 dark:bg-emerald-950/20 p-3.5 flex items-center gap-3.5 shadow-xs">
                    {/* Thumbnail yang bisa diklik untuk preview zoom */}
                    <div
                      onClick={() => setIsPreviewOpen(true)}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border bg-background shrink-0 cursor-pointer group shadow-xs hover:ring-2 hover:ring-[#0E8A6F] transition-all"
                      title="Klik untuk memperbesar bukti"
                    >
                      <Image
                        src={proofUrl}
                        alt="Bukti Pembayaran"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center gap-1.5 text-[#0A5F4D] dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Bukti Siap Dikirim</span>
                      </div>
                      <p className="text-[11px] text-foreground font-medium mt-0.5 truncate">
                        {proofFileName || 'Foto struk / bukti transfer'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Klik gambar untuk memperbesar
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-xs h-7 px-2 gap-1"
                        title="Pratinjau bukti bayar"
                      >
                        <Eye className="h-3 w-3" />
                        <span className="hidden sm:inline">Pratinjau</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-7 px-2"
                      >
                        Ganti
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUploading}
                        onClick={handleRemoveProof}
                        className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Hapus bukti ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label="Unggah file bukti pembayaran"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : isUploading
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-muted-foreground/30 hover:border-primary hover:bg-muted/30'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          Sedang mengunggah gambar bukti...
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className={`p-3 rounded-full transition-colors ${
                            isDragging
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground">
                            {isDragging
                              ? 'Lepaskan berkas gambar di sini'
                              : 'Tarik & lepas atau klik untuk memilih file bukti bayar'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Mendukung JPG, PNG, atau WebP (Maksimal 2 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info Catatan */}
            <div className="rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5 border">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span className="leading-relaxed">
                {selectedMethod === 'CASH'
                  ? 'Catatan: Pendaftaran tunai berstatus Pending hingga panitia mengonfirmasi penerimaan uang di meja registrasi lokasi acara.'
                  : 'Catatan: Pembayaran akan diverifikasi oleh panitia sebelum tiket resmi terbit otomatis di akun Anda.'}
              </span>
            </div>

            {/* Footer Aksi */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting || isUploading}
                className="text-xs h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePay}
                disabled={
                  isSubmitting || isUploading || (selectedMethod !== 'CASH' && !proofUrl)
                }
                className="text-xs h-9 gap-2 min-w-40 font-semibold focus-visible:ring-2 focus-visible:ring-primary"
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
                Pratinjau: {proofFileName || 'Bukti Pembayaran'}
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
