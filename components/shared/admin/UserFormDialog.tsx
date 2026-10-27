'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUserAction, updateUserAction } from '@/lib/actions/users'
import { ManagedUser, UserRole } from '@/types'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Lock,
  Hash,
  Shield,
  AlertCircle,
  Loader2,
  X,
  UserPlus,
  Check,
} from 'lucide-react'

interface UserFormDialogProps {
  isOpen: boolean
  onClose: () => void
  userToEdit: ManagedUser | null
  currentAdminId: string
  onSuccess: (user: ManagedUser, isNew: boolean) => void
}

interface UserFormModalContentProps {
  onClose: () => void
  userToEdit: ManagedUser | null
  currentAdminId: string
  onSuccess: (user: ManagedUser, isNew: boolean) => void
}

function UserFormModalContent({
  onClose,
  userToEdit,
  currentAdminId,
  onSuccess,
}: UserFormModalContentProps) {
  const isEditMode = !!userToEdit

  const [fullName, setFullName] = useState(userToEdit?.full_name ?? '')
  const [nim, setNim] = useState(userToEdit?.nim ?? '')
  const [email, setEmail] = useState(userToEdit?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(userToEdit?.role ?? 'MAHASISWA')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const isSelf = userToEdit?.id === currentAdminId
  const hasActiveEvents = (userToEdit?.active_events_count ?? 0) > 0

  // Kontrol tombol Escape dan kunci scroll latar belakang saat dialog aktif
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [onClose, isSubmitting])

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Nama lengkap minimal 2 karakter'
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Nama lengkap maksimal 100 karakter'
    }

    if (nim.trim() && nim.trim().length > 20) {
      errors.nim = 'NIM maksimal 20 karakter'
    }

    if (!isEditMode) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Format email tidak valid'
      }
      if (!password || password.length < 8) {
        errors.password = 'Password minimal 8 karakter'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    try {
      if (isEditMode && userToEdit) {
        const res = await updateUserAction(userToEdit.id, {
          full_name: fullName.trim(),
          nim: nim.trim() || undefined,
          role,
        })

        if (!res.ok) {
          toast.error(res.error)
          return
        }

        onSuccess(
          {
            ...userToEdit,
            full_name: fullName.trim(),
            nim: nim.trim() || null,
            role,
          },
          false
        )
        toast.success('Data pengguna berhasil diperbarui')
        onClose()
      } else {
        const res = await createUserAction({
          full_name: fullName.trim(),
          nim: nim.trim() || undefined,
          email: email.trim(),
          password,
          role,
        })

        if (!res.ok) {
          toast.error(res.error)
          return
        }

        onSuccess(
          {
            id: res.data.id,
            full_name: fullName.trim(),
            nim: nim.trim() || null,
            email: email.trim(),
            role,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          true
        )
        toast.success('Pengguna baru berhasil ditambahkan')
        onClose()
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat memproses data pengguna')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {isEditMode ? <Shield className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h2
                id="user-form-dialog-title"
                className="font-bold text-lg leading-tight text-foreground"
              >
                {isEditMode ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditMode
                  ? 'Perbarui informasi dan hak akses pengguna ini.'
                  : 'Daftarkan akun pengguna baru ke sistem.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
            aria-label="Tutup form pengguna"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <Label htmlFor="user-fullname" className="text-xs font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Nama Lengkap</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              disabled={isSubmitting}
              className={`text-sm focus-visible:ring-2 focus-visible:ring-primary ${
                formErrors.fullName ? 'border-destructive' : ''
              }`}
              maxLength={100}
              autoFocus
            />
            {formErrors.fullName && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" />
                <span>{formErrors.fullName}</span>
              </p>
            )}
          </div>

          {/* NIM */}
          <div className="space-y-1.5">
            <Label htmlFor="user-nim" className="text-xs font-semibold flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span>NIM (Nomor Induk Mahasiswa)</span>
              <span className="text-muted-foreground text-[10px] font-normal">(Opsional)</span>
            </Label>
            <Input
              id="user-nim"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: 12345678"
              disabled={isSubmitting}
              className={`text-sm focus-visible:ring-2 focus-visible:ring-primary ${
                formErrors.nim ? 'border-destructive font-mono' : 'font-mono'
              }`}
              maxLength={20}
            />
            {formErrors.nim && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" />
                <span>{formErrors.nim}</span>
              </p>
            )}
          </div>

          {/* Email (Hanya saat create) */}
          <div className="space-y-1.5">
            <Label htmlFor="user-email" className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Email Akun</span>
              {!isEditMode && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@example.com"
              disabled={isSubmitting || isEditMode}
              className={`text-sm focus-visible:ring-2 focus-visible:ring-primary ${
                formErrors.email ? 'border-destructive' : ''
              } ${
                isEditMode ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''
              }`}
            />
            {formErrors.email && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" />
                <span>{formErrors.email}</span>
              </p>
            )}
            {isEditMode && (
              <p className="text-[11px] text-muted-foreground">
                Email terikat pada identitas akun dan tidak dapat diubah di sini.
              </p>
            )}
          </div>

          {/* Password (Hanya saat create) */}
          {!isEditMode && (
            <div className="space-y-1.5">
              <Label htmlFor="user-password" className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Password Sementara</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                disabled={isSubmitting}
                className={`text-sm focus-visible:ring-2 focus-visible:ring-primary ${
                  formErrors.password ? 'border-destructive' : ''
                }`}
              />
              {formErrors.password && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  <span>{formErrors.password}</span>
                </p>
              )}
            </div>
          )}

          {/* Pilihan Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Role Pengguna</span>
              <span className="text-destructive">*</span>
            </Label>

            {isSelf ? (
              <div className="p-3 bg-muted/60 rounded-xl text-xs text-muted-foreground border">
                Anda tidak dapat mengubah role akun Anda sendiri demi keamanan sistem.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(['MAHASISWA', 'PANITIA', 'ADMIN'] as UserRole[]).map((r) => {
                  const isSelected = role === r
                  const isBlockedByEvents = isEditMode && hasActiveEvents && r !== 'PANITIA'

                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={isSubmitting || isBlockedByEvents}
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-border hover:bg-muted/40'
                      } ${isBlockedByEvents ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {r}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {r === 'ADMIN'
                          ? 'Akses penuh'
                          : r === 'PANITIA'
                          ? 'Kelola event'
                          : 'Peserta event'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {isEditMode && hasActiveEvents && role !== 'PANITIA' && (
              <div className="p-3 mt-2 bg-[#FFEBD1]/60 dark:bg-amber-950/30 border border-[#E07A00]/25 dark:border-amber-900/50 rounded-xl text-xs text-[#8A4B00] dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#E07A00]" />
                <div>
                  <span className="font-semibold">Peringatan: </span>
                  Pengguna ini memiliki {userToEdit?.active_events_count} event aktif. Penurunan role akan ditolak oleh sistem sampai event tersebut selesai atau dibatalkan.
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 px-4 gap-2 font-semibold min-w-32 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Simpan Perubahan' : 'Tambahkan Akun'}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UserFormDialog({
  isOpen,
  onClose,
  userToEdit,
  currentAdminId,
  onSuccess,
}: UserFormDialogProps) {
  if (!isOpen) return null

  return (
    <UserFormModalContent
      key={userToEdit?.id ?? 'create-new-user'}
      onClose={onClose}
      userToEdit={userToEdit}
      currentAdminId={currentAdminId}
      onSuccess={onSuccess}
    />
  )
}
