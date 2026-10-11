'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createEventAction, updateEventAction, updateEventStatusAction, deleteDraftEventAction } from '@/lib/actions/events'
import { EventStatus } from '@/lib/validators/events'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Trash2, CheckCircle2, PlayCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface CategoryOption {
  id: string
  name: string
}

interface EventData {
  id: string
  title: string
  category_id: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string | null
  location: string
  quota: number
  price: number
  poster_url: string | null
  status: EventStatus
}

interface EventFormProps {
  categories: CategoryOption[]
  initialData?: EventData
  isEditMode?: boolean
}

export function EventForm({ categories, initialData, isEditMode = false }: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form states
  const [title, setTitle] = useState(initialData?.title || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || (categories[0]?.id || ''))
  const [description, setDescription] = useState(initialData?.description || '')
  const [eventDate, setEventDate] = useState(initialData?.event_date || '')
  const [startTime, setStartTime] = useState(initialData?.start_time ? initialData.start_time.slice(0, 5) : '09:00')
  const [endTime, setEndTime] = useState(initialData?.end_time ? initialData.end_time.slice(0, 5) : '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [quota, setQuota] = useState(initialData?.quota?.toString() || '100')
  const [price, setPrice] = useState(initialData?.price?.toString() || '0')
  const [posterUrl, setPosterUrl] = useState(initialData?.poster_url || '')

  const currentStatus = initialData?.status || 'DRAFT'
  const isFinalStatus = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED'

  // Hitung tanggal minimum hari ini (WIB)
  const todayWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isFinalStatus) {
      toast.error('Event yang sudah selesai atau dibatalkan tidak dapat diubah')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        category_id: categoryId,
        description: description.trim() || undefined,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime.trim() ? endTime : undefined,
        location: location.trim(),
        quota: parseInt(quota, 10),
        price: parseInt(price, 10),
        poster_url: posterUrl.trim() || undefined,
      }

      if (isEditMode && initialData) {
        const res = await updateEventAction(initialData.id, payload)
        if (!res.ok) {
          toast.error(res.error)
        } else {
          toast.success('Rincian event berhasil diperbarui')
          router.refresh()
        }
      } else {
        const res = await createEventAction(payload)
        if (!res.ok) {
          toast.error(res.error)
        } else {
          toast.success('Event berhasil dibuat sebagai DRAFT')
          router.push('/panitia/events')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat memproses data event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: EventStatus) => {
    if (!initialData) return

    const confirmMsg =
      newStatus === 'CANCELLED'
        ? 'Apakah Anda yakin ingin membatalkan event ini? Pembatalan akan membatalkan seluruh tiket aktif.'
        : `Apakah Anda yakin ingin mengubah status event menjadi ${newStatus}?`

    if (!confirm(confirmMsg)) return

    setIsUpdatingStatus(true)
    try {
      const res = await updateEventStatusAction(initialData.id, newStatus)
      if (!res.ok) {
        toast.error(res.error)
      } else {
        toast.success(`Status event berhasil diubah menjadi ${newStatus}`)
        router.refresh()
      }
    } catch {
      toast.error('Gagal memperbarui status event')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeleteDraft = async () => {
    if (!initialData) return
    if (!confirm('Apakah Anda yakin ingin menghapus draft event ini secara permanen?')) return

    setIsDeleting(true)
    try {
      const res = await deleteDraftEventAction(initialData.id)
      if (!res.ok) {
        toast.error(res.error)
      } else {
        toast.success('Draft event berhasil dihapus')
        router.push('/panitia/events')
      }
    } catch {
      toast.error('Gagal menghapus draft event')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/panitia/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Event</span>
        </Link>
        {isEditMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status saat ini:</span>
            <Badge
              variant={
                currentStatus === 'PUBLISHED'
                  ? 'success'
                  : currentStatus === 'ONGOING'
                  ? 'info'
                  : currentStatus === 'COMPLETED'
                  ? 'muted'
                  : currentStatus === 'CANCELLED'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {currentStatus}
            </Badge>
          </div>
        )}
      </div>

      {/* Kontrol Transisi Status Khusus Mode Edit */}
      {isEditMode && initialData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Tindakan & Kendali Status Event</CardTitle>
            <CardDescription className="text-xs">
              Ubah siklus hidup event sesuai alur resmi: DRAFT ➔ PUBLISHED ➔ ONGOING ➔ COMPLETED / CANCELLED
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            {currentStatus === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('PUBLISHED')}
                  disabled={isUpdatingStatus}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Publikasikan (PUBLISHED)</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteDraft}
                  disabled={isDeleting}
                  className="gap-1.5"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>Hapus Draft</span>
                </Button>
              </>
            )}

            {currentStatus === 'PUBLISHED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('ONGOING')}
                  disabled={isUpdatingStatus}
                  className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Mulai Event (ONGOING)</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={isUpdatingStatus}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Batalkan Event (CANCELLED)</span>
                </Button>
              </>
            )}

            {currentStatus === 'ONGOING' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={isUpdatingStatus}
                  className="gap-1.5 bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selesaikan Event (COMPLETED)</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={isUpdatingStatus}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Batalkan Event (CANCELLED)</span>
                </Button>
              </>
            )}

            {isFinalStatus && (
              <p className="text-xs text-muted-foreground italic">
                Event ini berstatus final ({currentStatus}) dan tidak dapat diubah lagi.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Utama Event */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Informasi Event' : 'Buat Event Baru'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Perbarui detail informasi pelaksanaan event ini.'
              : 'Isi detail informasi event kampus. Event baru akan disimpan sebagai DRAFT.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Judul Event <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Seminar Nasional Kecerdasan Buatan 2026"
                required
                disabled={isFinalStatus || isSubmitting}
                minLength={3}
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground">Antara 3 hingga 150 karakter.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">
                  Kategori Event <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isFinalStatus || isSubmitting}
                  required
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event_date">
                  Tanggal Pelaksanaan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  value={eventDate}
                  min={isEditMode ? undefined : todayWIB}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  disabled={isFinalStatus || isSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">
                  Waktu Mulai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  disabled={isFinalStatus || isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_time">Waktu Selesai (Opsional)</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isFinalStatus || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">
                Lokasi / Tempat <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Gedung Auditorium Lt. 3 / Zoom Online"
                required
                disabled={isFinalStatus || isSubmitting}
                minLength={2}
                maxLength={200}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quota">
                  Kapasitas Kuota Peserta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quota"
                  type="number"
                  min="1"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  required
                  disabled={isFinalStatus || isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Minimal 1 peserta.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price">
                  Harga Tiket (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  disabled={isFinalStatus || isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Masukkan 0 jika event gratis.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="poster_url">URL Gambar Poster (Opsional)</Label>
              <Input
                id="poster_url"
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                disabled={isFinalStatus || isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Tautan gambar publik untuk poster event. Jika dikosongkan, placeholder otomatis akan digunakan.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi Lengkap Event (Opsional)</Label>
              <Textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan agenda, pembicara, fasilitas, dan ketentuan peserta..."
                disabled={isFinalStatus || isSubmitting}
              />
            </div>

            {!isFinalStatus && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/panitia/events')}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isEditMode ? 'Simpan Perubahan' : 'Buat Event (DRAFT)'}</span>
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
