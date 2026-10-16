'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'

interface PosterUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function PosterUpload({ value = '', onChange, disabled = false }: PosterUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [useManualUrl, setUseManualUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // 1. Validasi Tipe File
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Format berkas tidak didukung. Harap gunakan format JPG, PNG, atau WebP.')
      return
    }

    // 2. Validasi Ukuran File (Maksimal 2 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      toast.error(`Ukuran file (${sizeMB} MB) melebihi batas maksimal 2 MB.`)
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()

      // Dapatkan session user aktif
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('Sesi login tidak valid. Silakan masuk kembali.')
        return
      }

      // Format nama file: <user_id>/<timestamp>-<sanitized_filename>
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30)
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}.${ext}`

      // Unggah ke bucket 'event-posters'
      const { error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // Beri pesan user-friendly jika bucket belum dibuat atau belum ada izin
        if (uploadError.message.includes('Bucket not found')) {
          toast.error(
            'Bucket penyimpanan belum diaktifkan di database. Silakan jalankan migrasi 002_storage_posters.sql terlebih dahulu.'
          )
        } else {
          toast.error(`Gagal mengunggah poster: ${uploadError.message}`)
        }
        return
      }

      // Ambil Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('event-posters').getPublicUrl(filePath)

      onChange(publicUrl)
      toast.success('Poster berhasil diunggah')
    } catch {
      toast.error('Terjadi gangguan saat memproses berkas poster.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemovePoster = () => {
    onChange('')
    toast.info('Poster dihapus dari form.')
  }

  return (
    <div className="space-y-3">
      {/* Input File Tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />

      {/* Tampilan Jika Poster Sudah Ada (Pratinjau) */}
      {value ? (
        <div className="space-y-2">
          <div className="relative group overflow-hidden rounded-xl border bg-muted/30 shadow-sm max-w-lg aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Pratinjau Poster Event"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Overlay Aksi */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 shadow-sm text-xs"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>Ganti Berkas</span>
              </Button>

              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-background/90 text-foreground hover:bg-background shadow-sm transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Lihat Penuh</span>
              </a>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={disabled || isUploading}
                onClick={handleRemovePoster}
                className="gap-1.5 shadow-sm text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground max-w-lg">
            <span className="truncate max-w-[320px]">Tautan: {value}</span>
            <button
              type="button"
              onClick={() => setUseManualUrl(!useManualUrl)}
              className="text-primary hover:underline text-xs"
            >
              {useManualUrl ? 'Sembunyikan Input URL' : 'Edit URL Langsung'}
            </button>
          </div>

          {useManualUrl && (
            <div className="pt-1">
              <Input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://..."
                disabled={disabled || isUploading}
                className="text-xs"
              />
            </div>
          )}
        </div>
      ) : (
        /* Tampilan Jika Belum Ada Poster */
        <div className="space-y-2">
          {!useManualUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer select-none ${
                isDragging
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40'
              } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <div className="rounded-full bg-primary/10 p-3 mb-3 text-primary">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  {isUploading ? (
                    'Sedang mengunggah poster ke Supabase Storage...'
                  ) : (
                    <>
                      <span className="text-primary font-semibold hover:underline">
                        Klik untuk memilih berkas
                      </span>{' '}
                      atau seret gambar ke sini
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Mendukung JPG, PNG, atau WebP (Maksimal 2 MB, rasio disarankan 16:9)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                disabled={disabled || isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Tempelkan URL langsung dari internet untuk menggunakan gambar eksternal.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              Poster opsional (placeholder otomatis digunakan jika kosong)
            </span>
            <button
              type="button"
              onClick={() => setUseManualUrl(!useManualUrl)}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Link2 className="h-3.5 w-3.5" />
              {useManualUrl ? 'Gunakan Unggah Berkas' : 'Input URL Manual Saja'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
