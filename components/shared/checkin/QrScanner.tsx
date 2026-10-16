'use client'

import { useEffect, useRef, useState, useId, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeCameraScanConfig, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  RefreshCw,
  Volume2,
  VolumeX,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void
  isProcessing: boolean
  paused?: boolean
}

interface CameraDevice {
  id: string
  label: string
}

export function QrScanner({ onScanSuccess, isProcessing, paused = false }: QrScannerProps) {
  const uniqueId = useId().replace(/:/g, '')
  const containerId = `qr-reader-${uniqueId}`

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)

  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 })
  const isProcessingRef = useRef(isProcessing)
  const pausedRef = useRef(paused)

  useEffect(() => {
    isProcessingRef.current = isProcessing
    pausedRef.current = paused
  }, [isProcessing, paused])

  const playBeep = useCallback(() => {
    if (!soundEnabled) return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // 880Hz (A5)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {
      // AudioContext may be blocked before first user interaction
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80)
      } catch {
        // Ignored
      }
    }
  }, [soundEnabled])

  // Inisialisasi daftar kamera yang tersedia
  useEffect(() => {
    let isMounted = true

    async function initCameras() {
      try {
        setIsInitializing(true)
        setErrorMessage(null)

        const devices = await Html5Qrcode.getCameras()
        if (!isMounted) return

        if (devices && devices.length > 0) {
          setCameras(devices)
          // Cari kamera belakang (environment) secara default jika ada
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('belakang') ||
            d.label.toLowerCase().includes('environment')
          )
          setSelectedCameraId(backCam ? backCam.id : devices[0].id)
        } else {
          setErrorMessage('Tidak ditemukan perangkat kamera pada perangkat ini.')
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
          setErrorMessage(
            'Izin akses kamera ditolak. Silakan izinkan kamera di peramban Anda untuk menggunakan pemindai QR.'
          )
        } else {
          setErrorMessage(
            'Gagal mengakses kamera. Pastikan situs diakses melalui HTTPS atau localhost.'
          )
        }
      } finally {
        if (isMounted) setIsInitializing(false)
      }
    }

    initCameras()

    return () => {
      isMounted = false
    }
  }, [])

  // Jalankan scanner ketika kamera sudah siap
  useEffect(() => {
    if (!selectedCameraId || isInitializing) return

    let isCancelled = false
    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner

    const config: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const edge = Math.floor(minEdge * 0.7)
        return { width: edge, height: edge }
      },
      aspectRatio: 1.0,
    }

    const onScan = (decodedText: string) => {
      if (isCancelled || isProcessingRef.current || pausedRef.current) return

      const cleaned = decodedText.trim().toUpperCase()
      const now = Date.now()

      // Cooldown 2.5 detik untuk kode yang sama agar tidak menembak server berulang
      if (cleaned === lastScanRef.current.code && now - lastScanRef.current.time < 2500) {
        return
      }

      lastScanRef.current = { code: cleaned, time: now }
      setLastScannedCode(cleaned)
      playBeep()
      onScanSuccess(cleaned)
    }

    scanner
      .start(selectedCameraId, config, onScan, () => {})
      .then(() => {
        if (!isCancelled) {
          setIsStarted(true)
        } else {
          scanner.stop().then(() => scanner.clear()).catch(() => {})
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setIsStarted(false)
          setErrorMessage(`Gagal memulai kamera: ${err instanceof Error ? err.message : err}`)
        }
      })

    return () => {
      isCancelled = true
      setIsStarted(false)
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      }
    }
  }, [selectedCameraId, containerId, isInitializing, onScanSuccess, playBeep])

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    setSelectedCameraId(cameras[nextIndex].id)
  }

  return (
    <div className="space-y-4">
      {/* Viewport Scanner */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-950 aspect-square max-w-sm mx-auto shadow-inner flex items-center justify-center">
        {/* Kontainer DOM untuk render video oleh html5-qrcode */}
        <div id={containerId} className="w-full h-full object-cover" />

        {/* Overlay Loading / Inisialisasi */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white gap-2 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-medium">Menghubungkan ke kamera...</span>
          </div>
        )}

        {/* Overlay Error Kamera */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-white text-center gap-3 z-10">
            <ShieldAlert className="h-10 w-10 text-rose-500" />
            <p className="text-xs text-rose-200 leading-relaxed">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs text-slate-900 bg-white hover:bg-slate-100"
            >
              Coba Muat Ulang
            </Button>
          </div>
        )}

        {/* Frame Target Scanner & Garis Radar Animasi saat aktif */}
        {isStarted && !errorMessage && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Sudut Bidik Pemindai */}
            <div className="relative w-[70%] h-[70%] rounded-2xl border-2 border-primary/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Garis Radar Berjalan */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(36,59,155,0.8)] animate-pulse" />

              {/* Status Pemrosesan */}
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-xs text-white gap-1.5">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase">
                    Memvalidasi Tiket...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Indikator Status di Pojok Atas */}
        {isStarted && !errorMessage && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none z-10">
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-xs border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Kamera Aktif</span>
            </div>

            {lastScannedCode && (
              <div className="bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-amber-300 backdrop-blur-xs border border-white/10 truncate max-w-[150px]">
                {lastScannedCode}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kontrol Bar Pemindai */}
      <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
        {cameras.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSwitchCamera}
            disabled={isInitializing || !isStarted}
            className="text-xs gap-1.5 h-8 flex-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Ganti Kamera ({cameras.length})</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="text-xs gap-1.5 h-8 px-3"
          title={soundEnabled ? 'Matikan Suara Beep' : 'Nyalakan Suara Beep'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px]">Suara: Aktif</span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px]">Suara: Mati</span>
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Arahkan kamera ke QR Code pada kartu tiket digital peserta. Tiket akan otomatis terverifikasi.
      </p>
    </div>
  )
}
