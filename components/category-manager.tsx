'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/lib/actions/categories'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Layers, X, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

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
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

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
          toast.success('Kategori berhasil diperbarui')
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? { ...c, name: name.trim(), description: description.trim() || null }
                : c
            )
          )
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
          toast.success('Kategori baru berhasil ditambahkan')
          setCategories((prev) => [
            ...prev,
            {
              id: res.data.id,
              name: name.trim(),
              description: description.trim() || null,
              created_at: new Date().toISOString(),
            },
          ].sort((a, b) => a.name.localeCompare(b.name)))
          closeModal()
        }
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat menyimpan kategori')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) {
      return
    }

    setIsDeletingId(cat.id)
    try {
      const res = await deleteCategoryAction(cat.id)
      if (!res.ok) {
        toast.error(res.error)
      } else {
        toast.success(`Kategori "${cat.name}" berhasil dihapus`)
        setCategories((prev) => prev.filter((c) => c.id !== cat.id))
      }
    } catch {
      toast.error('Gagal menghapus kategori')
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Kategori Event</h1>
          <p className="text-muted-foreground mt-1">
            Tambah, perbarui, dan sesuaikan klasifikasi kategori event di kampus.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Belum Ada Kategori</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Sistem membutuhkan kategori agar panitia dapat mengelompokkan event yang dibuat.
            </p>
            <Button onClick={openCreateModal} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Buat Kategori Pertama</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="relative flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold">{cat.name}</CardTitle>
                </div>
                <CardDescription className="text-sm line-clamp-2">
                  {cat.description || 'Tidak ada deskripsi'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-end gap-2 border-t mt-4 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(cat)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Ubah</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(cat)}
                  disabled={isDeletingId === cat.id}
                  className="gap-1.5 h-8 text-xs"
                >
                  {isDeletingId === cat.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Hapus</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl border">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">
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
                />
                <p className="text-xs text-muted-foreground">Minimal 2 karakter, maksimal 50 karakter.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Deskripsi (Opsional)</Label>
                <Textarea
                  id="cat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat tentang kategori ini..."
                  rows={3}
                  maxLength={255}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
