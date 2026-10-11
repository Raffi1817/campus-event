'use server'

import { createClient } from '@/lib/supabase/server'
import { categorySchema, CategoryInput } from '@/lib/validators/categories'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Helper untuk verifikasi bahwa user sedang login dan memiliki role ADMIN.
 */
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Silakan login terlebih dahulu' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_active || profile.role !== 'ADMIN') {
    return { error: 'Akses ditolak: Hanya Administrator yang dapat mengelola kategori' }
  }

  return { supabase, user }
}

/**
 * Menambahkan kategori baru (Admin)
 */
export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const authCheck = await verifyAdmin()
  if (authCheck.error || !authCheck.supabase) {
    return { ok: false, error: authCheck.error || 'Autentikasi gagal' }
  }

  const { data, error } = await authCheck.supabase
    .from('categories')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Kategori dengan nama tersebut sudah ada' }
    }
    return { ok: false, error: error.message || 'Gagal menambahkan kategori' }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/events')
  return { ok: true, data: { id: data.id } }
}

/**
 * Memperbarui data kategori (Admin)
 */
export async function updateCategoryAction(
  id: string,
  input: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const authCheck = await verifyAdmin()
  if (authCheck.error || !authCheck.supabase) {
    return { ok: false, error: authCheck.error || 'Autentikasi gagal' }
  }

  const { data, error } = await authCheck.supabase
    .from('categories')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Kategori dengan nama tersebut sudah ada' }
    }
    return { ok: false, error: error.message || 'Gagal memperbarui kategori' }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/events')
  return { ok: true, data: { id: data.id } }
}

/**
 * Menghapus kategori (Admin)
 */
export async function deleteCategoryAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  const authCheck = await verifyAdmin()
  if (authCheck.error || !authCheck.supabase) {
    return { ok: false, error: authCheck.error || 'Autentikasi gagal' }
  }

  const { error } = await authCheck.supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    // 23503: foreign_key_violation
    if (error.code === '23503') {
      return {
        ok: false,
        error: 'Kategori ini tidak dapat dihapus karena masih digunakan oleh event yang ada',
      }
    }
    return { ok: false, error: error.message || 'Gagal menghapus kategori' }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/events')
  return { ok: true, data: { success: true } }
}
