'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/lib/actions/categories'
import { Category } from '@/types'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Layers, X, Loader2, AlertTriangle } from 'lucide-react'

interface CategoryManagerProps {
  initialCategories: Category[]
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State untuk modal konfirmasi hapus in-app
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Tutup modal form atau konfirmasi hapus dengan tombol Escape dan kontrol scroll body
  useEffect(() => {
    if (!isModalOpen && !categoryToDelete) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (categoryToDelete && !isDeleting) {
          setCategoryToDelete(null)
        } else if (isModalOpen && !isSubmitting) {
          closeModal()
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
  }, [isModalOpen, categoryToDelete, isSubmitting, isDeleting])

  const openCreateModal = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setIsModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id)
    setName(cat.name)
    setDescription(cat.description || '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setName('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama kategori wajib diisi')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingId) {
        const res = await updateCategoryAction(editingId, {
          name: name.trim(),
          description: description.trim() || undefined,
        })
        if (!res.ok) {
          toast.error(res.error)
        } else {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? { ...c, name: name.trim(), description: description.trim() || null }
                : c
            )
          )
          toast.success('Kategori berhasil diperbarui')
          closeModal()
        }
      } else {
        const res = await createCategoryAction({
          name: name.trim(),
          description: description.trim() || undefined,
        })
        if (!res.ok) {
          toast.error(res.error)
        } else {
          setCategories((prev) =>
            [
              ...prev,
              {
                id: res.data.id,
                name: name.trim(),
                description: description.trim() || null,
                created_at: new Date().toISOString(),
              },
            ].sort((a, b) => a.name.localeCompare(b.name))
          )
          toast.success('Kategori baru berhasil ditambahkan')
          closeModal()
        }
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat menyimpan kategori')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    try {
      const res = await deleteCategoryAction(categoryToDelete.id)
      if (!res.ok) {
        toast.error(res.error)
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
        toast.success(`Kategori "${categoryToDelete.name}" berhasil dihapus`)
        setCategoryToDelete(null)
      }
    } catch {
      toast.error('Gagal menghapus kategori')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Kelola Kategori Event
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tambah, perbarui, dan sesuaikan klasifikasi kategori event di kampus.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="gap-2 font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {/* Daftar Kategori / Empty State */}
      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Belum Ada Kategori</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Sistem membutuhkan kategori agar panitia dapat mengelompokkan event yang dibuat.
            </p>
            <Button onClick={openCreateModal} variant="outline" className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Buat Kategori Pertama</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="relative flex flex-col justify-between border-[#E1E4EE] dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold text-foreground">
                    {cat.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {cat.description || 'Tidak ada deskripsi'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-end gap-2 border-t border-[#E1E4EE] dark:border-slate-800/80 mt-4 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(cat)}
                  className="gap-1.5 h-8 text-xs font-medium"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Ubah</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryToDelete(cat)}
                  className="gap-1.5 h-8 text-xs font-medium text-[#9B1C31] dark:text-rose-400 border-[#D1344B]/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog Form (Tambah / Ubah) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-form-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              closeModal()
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3.5 border-b">
              <h2
                id="category-form-modal-title"
                className="text-lg font-bold text-foreground"
              >
                {editingId ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                aria-label="Tutup form kategori"
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name" className="text-xs font-bold text-foreground">
                  Nama Kategori <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Seminar, Workshop, Lomba..."
                  required
                  maxLength={50}
                  autoFocus
                  disabled={isSubmitting}
                  className="text-sm focus-visible:ring-2 focus-visible:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Minimal 2 karakter, maksimal 50 karakter.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc" className="text-xs font-bold text-foreground">
                  Deskripsi (Opsional)
                </Label>
                <Textarea
                  id="cat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat tentang kategori ini..."
                  rows={3}
                  maxLength={255}
                  disabled={isSubmitting}
                  className="text-sm focus-visible:ring-2 focus-visible:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="text-xs h-9 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs h-9 gap-2 font-semibold min-w-28 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus In-App (Pengganti window.confirm) */}
      {categoryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setCategoryToDelete(null)
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#FDE3E7] text-[#9B1C31] dark:bg-rose-950/60 dark:text-rose-400 border border-[#D1344B]/20 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="category-delete-dialog-title"
                  className="text-lg font-bold text-foreground"
                >
                  Hapus Kategori Event?
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Apakah Anda yakin ingin menghapus kategori{' '}
                  <strong className="text-foreground">{categoryToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <div className="rounded-xl p-3 bg-muted/60 border text-xs text-muted-foreground leading-relaxed">
              Kategori yang telah digunakan oleh event aktif tidak dapat dihapus oleh sistem untuk menjaga keutuhan data.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="text-xs h-9 px-4"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={confirmDeleteCategory}
                disabled={isDeleting}
                className="text-xs h-9 min-w-28 font-semibold gap-1.5 bg-[#D1344B] hover:bg-[#9B1C31] text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Kategori</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
