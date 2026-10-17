'use client'

import { useState, useMemo } from 'react'
import { ManagedUser, UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { UserFormDialog } from './UserFormDialog'
import { setUserActiveAction } from '@/lib/actions/users'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Edit2,
  UserCheck,
  UserX,
  Loader2,
  X,
  GraduationCap,
  Briefcase,
} from 'lucide-react'

interface UserManagerProps {
  initialUsers: ManagedUser[]
  currentAdminId: string
}

export function UserManager({ initialUsers, currentAdminId }: UserManagerProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Form Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null)

  // Status Toggle Dialog State
  const [userToToggle, setUserToToggle] = useState<ManagedUser | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nim && u.nim.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.is_active) ||
        (statusFilter === 'INACTIVE' && !u.is_active)

      return matchSearch && matchRole && matchStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      mahasiswa: users.filter((u) => u.role === 'MAHASISWA').length,
      panitia: users.filter((u) => u.role === 'PANITIA').length,
      admin: users.filter((u) => u.role === 'ADMIN').length,
      inactive: users.filter((u) => !u.is_active).length,
    }
  }, [users])

  const openCreateModal = () => {
    setUserToEdit(null)
    setIsFormOpen(true)
  }

  const openEditModal = (user: ManagedUser) => {
    setUserToEdit(user)
    setIsFormOpen(true)
  }

  const handleFormSuccess = (updatedUser: ManagedUser, isNew: boolean) => {
    if (isNew) {
      setUsers((prev) => [updatedUser, ...prev])
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      )
    }
  }

  const handleConfirmToggleActive = async () => {
    if (!userToToggle) return

    const newStatus = !userToToggle.is_active
    setIsTogglingStatus(true)

    try {
      const res = await setUserActiveAction(userToToggle.id, { is_active: newStatus })
      if (!res.ok) {
        toast.error(res.error)
        return
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userToToggle.id ? { ...u, is_active: newStatus } : u))
      )
      setUserToToggle(null)
    } catch {
      toast.error('Terjadi kesalahan sistem saat memperbarui status pengguna')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      case 'PANITIA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            <span>Kelola Pengguna</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manajemen akun pengguna, hak akses peran (Role), dan status keaktifan di sistem CampusEvent.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="gap-2 font-medium shrink-0 self-start sm:self-auto shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Pengguna</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2 text-foreground">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Mahasiswa</span>
              <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-300">
              {stats.mahasiswa}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Panitia</span>
              <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-700 dark:text-blue-300">
              {stats.panitia}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Admin</span>
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-purple-700 dark:text-purple-300">
              {stats.admin}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Nonaktif</span>
              <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-rose-700 dark:text-rose-300">
              {stats.inactive}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kontrol Pencarian & Filter */}
      <Card className="shadow-xs border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Input Cari */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, email, atau NIM..."
                className="pl-9 bg-background"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Role */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground shrink-0 hidden sm:inline">
                Role:
              </span>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-muted/30 text-xs">
                {['ALL', 'MAHASISWA', 'PANITIA', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      roleFilter === r
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r === 'ALL' ? 'Semua' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground shrink-0 hidden sm:inline">
                Status:
              </span>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-muted/30 text-xs">
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'ACTIVE', label: 'Aktif' },
                  { key: 'INACTIVE', label: 'Nonaktif' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      statusFilter === s.key
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pengguna (Desktop) & Card List (Mobile) */}
      <Card className="shadow-xs border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">Tidak Ada Pengguna Ditemukan</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Tidak ada data yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
            </p>
            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('ALL')
                  setStatusFilter('ALL')
                }}
                className="mt-2 text-xs"
              >
                Reset Semua Filter
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Tampilan Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">NIM</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Terdaftar</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentAdminId
                    const dateStr = new Intl.DateTimeFormat('id-ID', {
                      dateStyle: 'medium',
                      timeZone: 'Asia/Jakarta',
                    }).format(new Date(user.created_at))

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          !user.is_active ? 'opacity-65 bg-slate-50/50 dark:bg-slate-900/30' : ''
                        }`}
                      >
                        {/* Pengguna (Avatar, Nama, Email) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                              {getInitials(user.full_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground truncate max-w-[180px]">
                                  {user.full_name}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground truncate block">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* NIM */}
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {user.nim || '-'}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRoleBadgeStyle(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>Nonaktif</span>
                            </span>
                          )}
                        </td>

                        {/* Terdaftar */}
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {dateStr}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              className="h-8 text-xs gap-1"
                              title="Ubah data pengguna"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Ubah</span>
                            </Button>

                            {isSelf ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="h-8 text-xs text-muted-foreground cursor-not-allowed"
                                title="Tidak dapat mengubah status akun sendiri"
                              >
                                Akun Anda
                              </Button>
                            ) : (
                              <Button
                                variant={user.is_active ? 'ghost' : 'outline'}
                                size="sm"
                                onClick={() => setUserToToggle(user)}
                                className={`h-8 text-xs gap-1 ${
                                  user.is_active
                                    ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                    : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                              >
                                {user.is_active ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5" />
                                    <span className="hidden lg:inline">Nonaktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5" />
                                    <span className="hidden lg:inline">Aktifkan</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Mobile Card List */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentAdminId
                return (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground">
                              {user.full_name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-primary/15 text-primary">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getRoleBadgeStyle(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground border-t border-slate-100 dark:border-slate-800/80">
                      <span>NIM: <strong className="font-mono text-foreground">{user.nim || '-'}</strong></span>
                      <div className="flex items-center gap-1.5">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        className="flex-1 h-8 text-xs gap-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Ubah</span>
                      </Button>

                      {!isSelf && (
                        <Button
                          variant={user.is_active ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => setUserToToggle(user)}
                          className={`flex-1 h-8 text-xs gap-1.5 ${
                            user.is_active
                              ? 'text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              <span>Nonaktifkan</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Aktifkan</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* Modal Form Tambah / Ubah */}
      <UserFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userToEdit={userToEdit}
        currentAdminId={currentAdminId}
        onSuccess={handleFormSuccess}
      />

      {/* Modal Konfirmasi Toggle Status Aktif */}
      {userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-2 font-bold text-lg ${
                  userToToggle.is_active ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {userToToggle.is_active ? (
                  <UserX className="h-5 w-5" />
                ) : (
                  <UserCheck className="h-5 w-5" />
                )}
                <span>
                  {userToToggle.is_active ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
                </span>
              </div>
              <button
                onClick={() => !isTogglingStatus && setUserToToggle(null)}
                disabled={isTogglingStatus}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Apakah Anda yakin ingin {userToToggle.is_active ? 'menonaktifkan' : 'mengaktifkan kembali'}{' '}
                pengguna berikut?
              </p>

              <div className="rounded-xl bg-muted/60 p-3.5 border space-y-1">
                <p className="font-bold text-foreground">{userToToggle.full_name}</p>
                <p className="text-xs text-muted-foreground">{userToToggle.email}</p>
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getRoleBadgeStyle(
                      userToToggle.role
                    )}`}
                  >
                    {userToToggle.role}
                  </span>
                </div>
              </div>

              {userToToggle.is_active ? (
                <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50">
                  <p className="font-semibold">Dampak Penonaktifan:</p>
                  <p className="mt-0.5">
                    Pengguna tidak akan dapat login lagi ke sistem hingga diaktifkan kembali oleh Administrator. Sesi aktif akan otomatis dikeluarkan.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                  Pengguna akan dapat kembali login dan menggunakan fitur CampusEvent sesuai perannya.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setUserToToggle(null)}
                disabled={isTogglingStatus}
              >
                Batal
              </Button>
              <Button
                variant={userToToggle.is_active ? 'destructive' : 'default'}
                onClick={handleConfirmToggleActive}
                disabled={isTogglingStatus}
                className="gap-2 font-medium"
              >
                {isTogglingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{userToToggle.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
