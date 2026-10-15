'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createUserSchema,
  CreateUserInput,
  updateUserSchema,
  UpdateUserInput,
  setUserActiveSchema,
  SetUserActiveInput,
} from '@/lib/validators/users'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/types'

/**
 * Helper untuk verifikasi bahwa user sedang login dan memiliki role ADMIN.
 */
async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Silakan login terlebih dahulu' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_active || profile.role !== 'ADMIN') {
    return { error: 'Akses ditolak: Hanya Administrator yang dapat mengelola pengguna' }
  }

  return { supabase, user, profile }
}

/**
 * Menambahkan pengguna baru (Admin)
 * Menggunakan Supabase Admin API untuk mendaftarkan akun di Auth,
 * lalu menetapkan role di tabel profiles.
 */
export async function createUserAction(
  input: CreateUserInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const authCheck = await verifyAdmin()
  if (authCheck.error || !authCheck.supabase) {
    return { ok: false, error: authCheck.error || 'Autentikasi gagal' }
  }

  // Cek apakah email sudah terdaftar
  const { data: existingEmail } = await authCheck.supabase
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle()

  if (existingEmail) {
    return { ok: false, error: 'Email sudah terdaftar dalam sistem' }
  }

  // Cek keunikan NIM jika diisi
  const cleanNim = parsed.data.nim?.trim() || null
  if (cleanNim) {
    const { data: existingNim } = await authCheck.supabase
      .from('profiles')
      .select('id')
      .eq('nim', cleanNim)
      .maybeSingle()

    if (existingNim) {
      return { ok: false, error: 'NIM sudah digunakan oleh pengguna lain' }
    }
  }

  // Gunakan Supabase Admin Client (Service Role) untuk membuat akun Auth
  let adminSupabase
  try {
    adminSupabase = await createAdminClient()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Konfigurasi admin gagal'
    return { ok: false, error: msg }
  }

  const { data: authUser, error: createAuthError } =
    await adminSupabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        nim: cleanNim,
      },
    })

  if (createAuthError || !authUser.user) {
    return {
      ok: false,
      error: createAuthError?.message || 'Gagal membuat pengguna di sistem autentikasi',
    }
  }

  const newUserId = authUser.user.id

  // Trigger database on_auth_user_created selalu menginisialisasi role ke 'MAHASISWA'.
  // Jika admin memilih role lain (PANITIA atau ADMIN), update role sekarang.
  if (parsed.data.role !== 'MAHASISWA') {
    const { error: updateRoleError } = await adminSupabase
      .from('profiles')
      .update({ role: parsed.data.role })
      .eq('id', newUserId)

    if (updateRoleError) {
      // Rollback pembuatan user auth agar tidak ada akun tersangkut
      await adminSupabase.auth.admin.deleteUser(newUserId)
      return {
        ok: false,
        error: `Gagal menetapkan peran pengguna: ${updateRoleError.message}`,
      }
    }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
  return { ok: true, data: { id: newUserId } }
}

/**
 * Memperbarui data pengguna (Admin)
 * Mengubah nama, NIM, dan role.
 * Memvalidasi penjagaan keamanan: tidak boleh menurunkan role sendiri,
 * dan menolak penurunan role PANITIA jika masih mengelola event aktif.
 */
export async function updateUserAction(
  userId: string,
  input: UpdateUserInput
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const authCheck = await verifyAdmin()
  if (authCheck.error || !authCheck.supabase || !authCheck.user) {
    return { ok: false, error: authCheck.error || 'Autentikasi gagal' }
  }

  // Admin tidak boleh menurunkan role dirinya sendiri
  if (userId === authCheck.user.id && parsed.data.role !== 'ADMIN') {
    return {
      ok: false,
      error: 'Anda tidak dapat mengubah role akun Anda sendiri demi keamanan sistem',
    }
  }

  // Ambil profil target
  const { data: targetProfile, error: targetError } = await authCheck.supabase
    .from('profiles')
    .select('id, full_name, nim, email, role, is_active')
    .eq('id', userId)
    .single()

  if (targetError || !targetProfile) {
    return { ok: false, error: 'Pengguna tidak ditemukan' }
  }

  // Validasi jika role diturunkan dari PANITIA ke role lain:
  // Tolak jika panitia ini masih memiliki event aktif (DRAFT, PUBLISHED, ONGOING)
  if (targetProfile.role === 'PANITIA' && parsed.data.role !== 'PANITIA') {
    const { count, error: countError } = await authCheck.supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', userId)
      .in('status', ['DRAFT', 'PUBLISHED', 'ONGOING'])

    if (countError) {
      return { ok: false, error: 'Gagal memverifikasi status event yang dikelola panitia' }
    }

    if (count && count > 0) {
      return {
        ok: false,
        error: `Tidak dapat mengubah role: Panitia ini masih mengelola ${count} event aktif (Draft/Published/Ongoing). Selesaikan, ubah penyelenggara, atau batalkan event terlebih dahulu.`,
      }
    }
  }

  // Validasi keunikan NIM jika diubah
  const cleanNim = parsed.data.nim?.trim() || null
  if (cleanNim && cleanNim !== targetProfile.nim) {
    const { data: existingNim } = await authCheck.supabase
      .from('profiles')
      .select('id')
      .eq('nim', cleanNim)
      .neq('id', userId)
      .maybeSingle()

    if (existingNim) {
      return { ok: false, error: 'NIM sudah digunakan oleh pengguna lain' }
    }
  }

  const { error: updateError } = await authCheck.supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      nim: cleanNim,
      role: parsed.data.role,
    })
    .eq('id', userId)

  if (updateError) {
    return { ok: false, error: updateError.message || 'Gagal memperbarui data pengguna' }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
  return { ok: true, data: { success: true } }
}

/**
 * Mengubah status aktif akun pengguna (Admin)
 * Admin tidak bisa menonaktifkan dirinya sendiri.
 */
export async function setUserActiveAction(
  userId: string,
  input: SetUserActiveInput
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = setUserActiveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const authCheck = await verifyAdmin()
  if (authCheck.error || !authCheck.supabase || !authCheck.user) {
    return { ok: false, error: authCheck.error || 'Autentikasi gagal' }
  }

  // Admin tidak boleh menonaktifkan dirinya sendiri
  if (userId === authCheck.user.id && !parsed.data.is_active) {
    return {
      ok: false,
      error: 'Anda tidak dapat menonaktifkan akun Anda sendiri',
    }
  }

  const { error: updateError } = await authCheck.supabase
    .from('profiles')
    .update({ is_active: parsed.data.is_active })
    .eq('id', userId)

  if (updateError) {
    return { ok: false, error: updateError.message || 'Gagal memperbarui status aktif pengguna' }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
  return { ok: true, data: { success: true } }
}
