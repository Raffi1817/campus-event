'use server'

import { createClient } from '@/lib/supabase/server'
import { updateProfileSchema, UpdateProfileInput } from '@/lib/validators/profile'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/types'

/**
 * Memperbarui nama profil pengguna yang sedang login.
 * Kolom email, role, dan is_active dilindungi trigger database.
 */
export async function updateMyNameAction(
  input: UpdateProfileInput
): Promise<ActionResult<{ full_name: string }>> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, error: 'Silakan login terlebih dahulu' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name })
    .eq('id', user.id)

  if (updateError) {
    return { ok: false, error: updateError.message || 'Gagal memperbarui nama profil' }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/panitia/dashboard')
  revalidatePath('/admin/dashboard')
  return { ok: true, data: { full_name: parsed.data.full_name } }
}
