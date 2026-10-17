'use client'

import { useState } from 'react'
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
        onClose()
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat memproses data pengguna')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {isEditMode ? <Shield className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-foreground">
                {isEditMode ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? 'Perbarui informasi dan hak akses pengguna ini.'
                  : 'Daftarkan akun pengguna baru ke sistem.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors cursor-pointer"
            aria-label="Tutup"
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
              className={formErrors.fullName ? 'border-destructive' : ''}
              maxLength={100}
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
              className={formErrors.nim ? 'border-destructive font-mono' : 'font-mono'}
              maxLength={20}
            />
            {formErrors.nim && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3 w-3" />
                <span>{formErrors.nim}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="user-email" className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Alamat Email</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@example.com"
              disabled={isSubmitting || isEditMode}
              className={`${formErrors.email ? 'border-destructive' : ''} ${
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
                className={formErrors.password ? 'border-destructive' : ''}
              />
              {formErrors.password && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  <span>{formErrors.password}</span>
                </p>
              )}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="user-role" className="text-xs font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Peran (Role)</span>
              <span className="text-destructive">*</span>
            </Label>

            {isSelf ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Perlindungan Akun Sendiri:</p>
                <p className="mt-0.5">Anda tidak dapat menurunkan role akun Administrator Anda sendiri.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(['MAHASISWA', 'PANITIA', 'ADMIN'] as UserRole[]).map((r) => {
                  const isSelected = role === r
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{r}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  )
                })}
              </div>
            )}

            {isEditMode && hasActiveEvents && role !== 'PANITIA' && (
              <div className="p-3 mt-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
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
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 font-medium"
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
