'use client'

import { useState, useTransition } from 'react'
import { updateMyNameAction } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { User, Mail, Hash, Shield, Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { Profile } from '@/types'

interface ProfileFormProps {
  initialProfile: Profile
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfile.full_name)
  const [isPending, startTransition] = useTransition()
  const [hasChanged, setHasChanged] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFullName(val)
    setHasChanged(val.trim() !== initialProfile.full_name)
    if (justSaved) setJustSaved(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = fullName.trim()
    if (trimmed.length < 2) {
      toast.error('Nama lengkap minimal 2 karakter')
      return
    }

    if (trimmed.length > 100) {
      toast.error('Nama lengkap maksimal 100 karakter')
      return
    }

    startTransition(async () => {
      const res = await updateMyNameAction({ full_name: trimmed })
      if (!res.ok) {
        toast.error(res.error)
      } else {
        setJustSaved(true)
        setHasChanged(false)
        setTimeout(() => setJustSaved(false), 3000)
      }
    })
  }

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(initialProfile.created_at))

  const getRoleBadgeStyle = () => {
    switch (initialProfile.role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      case 'PANITIA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-xs border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Profil Pengguna</CardTitle>
              <CardDescription>
                Kelola informasi akun Anda yang terdaftar pada sistem CampusEvent.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-5">
            {/* Nama Lengkap (Editable) */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-semibold flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Nama Lengkap</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={fullName}
                onChange={handleNameChange}
                placeholder="Masukkan nama lengkap Anda"
                disabled={isPending}
                required
                maxLength={100}
                className="bg-background focus-visible:ring-primary"
              />
              <p className="text-[12px] text-muted-foreground">
                Nama ini akan digunakan pada pendaftaran event dan kartu tiket Anda.
              </p>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Alamat Email</span>
              </Label>
              <Input
                id="email"
                value={initialProfile.email}
                disabled
                className="bg-slate-100/70 dark:bg-slate-900/50 text-muted-foreground cursor-not-allowed border-dashed"
              />
              <p className="text-[12px] text-muted-foreground">
                Email akun terhubung langsung ke autentikasi sistem dan tidak dapat diubah secara mandiri.
              </p>
            </div>

            {/* NIM & Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NIM (Readonly) */}
              <div className="space-y-2">
                <Label htmlFor="nim" className="text-sm font-semibold flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Nomor Induk Mahasiswa (NIM)</span>
                </Label>
                <Input
                  id="nim"
                  value={initialProfile.nim || 'Tidak diatur'}
                  disabled
                  className="bg-slate-100/70 dark:bg-slate-900/50 text-muted-foreground cursor-not-allowed border-dashed font-mono"
                />
              </div>

              {/* Role (Readonly) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Peran Pengguna</span>
                </Label>
                <div className="h-9 px-3 flex items-center rounded-md border border-dashed bg-slate-100/70 dark:bg-slate-900/50">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRoleBadgeStyle()}`}
                  >
                    {initialProfile.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Tanggal Bergabung */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Terdaftar sejak: {formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Akun Aktif</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
            <span className="text-xs text-muted-foreground">
              {hasChanged ? 'Ada perubahan yang belum disimpan.' : 'Profil Anda sudah yang terbaru.'}
            </span>
            <div className="flex items-center gap-2.5">
              {justSaved && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                  Tersimpan ✓
                </span>
              )}
              <Button
                type="submit"
                disabled={isPending || !hasChanged}
                className="gap-2 font-medium"
              >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
