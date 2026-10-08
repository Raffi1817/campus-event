'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema, LoginInput, RegisterInput } from '@/lib/validators/auth'
import { redirect } from 'next/navigation'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function loginAction(values: LoginInput): Promise<ActionResult<{ role: string }>> {
  const parsed = loginSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.user) {
    return { ok: false, error: 'Email atau password salah.' }
  }

  // Periksa apakah akun aktif dan ambil role dari tabel profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Profil pengguna tidak ditemukan.' }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Akun Anda dinonaktifkan. Silakan hubungi admin.' }
  }

  return { ok: true, data: { role: profile.role } }
}

export async function registerAction(values: RegisterInput): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        nim: parsed.data.nim || null,
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { ok: false, error: 'Email sudah terdaftar. Silakan gunakan email lain.' }
    }
    return { ok: false, error: error.message }
  }

  if (!data.user) {
    return { ok: false, error: 'Gagal membuat akun.' }
  }

  return { ok: true, data: { email: data.user.email || parsed.data.email } }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
