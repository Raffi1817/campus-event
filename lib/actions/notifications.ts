'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const notificationIdSchema = z.string().uuid({ message: 'ID notifikasi tidak valid' })

/**
 * Menandai satu notifikasi sebagai sudah dibaca
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResult<null>> {
  const parsed = notificationIdSchema.safeParse(notificationId)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'ID notifikasi tidak valid' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, error: 'Silakan login terlebih dahulu' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', parsed.data)
    .eq('user_id', user.id)

  if (error) {
    return { ok: false, error: error.message || 'Gagal menandai notifikasi sebagai dibaca' }
  }

  revalidatePath('/notifications')
  revalidatePath('/dashboard')
  return { ok: true, data: null }
}

/**
 * Menandai semua notifikasi milik user aktif sebagai sudah dibaca
 */
export async function markAllNotificationsAsReadAction(): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, error: 'Silakan login terlebih dahulu' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    return { ok: false, error: error.message || 'Gagal menandai semua notifikasi' }
  }

  revalidatePath('/notifications')
  revalidatePath('/dashboard')
  return { ok: true, data: null }
}
