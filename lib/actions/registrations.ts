'use server'

import { createClient } from '@/lib/supabase/server'
import {
  registerEventSchema,
  cancelRegistrationSchema,
  RegisterEventInput,
  CancelRegistrationInput,
} from '@/lib/validators/registrations'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Helper untuk verifikasi sesi user login dan mendapatkan profilnya.
 */
async function getAuthenticatedStudent() {
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
    .select('role, is_active, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_active) {
    return { error: 'Akun tidak valid atau telah dinonaktifkan' }
  }

  return { supabase, user, profile }
}

/**
 * Pendaftaran event oleh Mahasiswa.
 * Menggunakan RPC register_for_event di database PostgreSQL untuk menjamin:
 * - Pemeriksaan status event (PUBLISHED) dan batas tanggal (WIB)
 * - Row locking (SELECT FOR UPDATE) untuk mencegah kuota terlampaui (race condition)
 * - Pencegahan pendaftaran ganda (BR-03)
 * - Event gratis otomatis terbit tiket dan status pembayaran PAID
 */
export async function registerEventAction(
  input: RegisterEventInput
): Promise<ActionResult<{ registrationId: string }>> {
  const parsed = registerEventSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input pendaftaran tidak valid' }
  }

  const auth = await getAuthenticatedStudent()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  if (auth.profile?.role !== 'MAHASISWA') {
    return { ok: false, error: 'Hanya akun Mahasiswa yang dapat mendaftar event' }
  }

  // Panggil fungsi database register_for_event
  const { data, error } = await auth.supabase.rpc('register_for_event', {
    p_event_id: parsed.data.eventId,
  })

  if (error) {
    return { ok: false, error: error.message || 'Gagal mendaftar ke event' }
  }

  // Revalidasi halaman terkait
  revalidatePath('/events')
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath('/my/registrations')
  revalidatePath('/dashboard')
  revalidatePath(`/panitia/events/${parsed.data.eventId}/participants`)
  revalidatePath('/admin/registrations')

  return {
    ok: true,
    data: {
      registrationId: data as string,
    },
  }
}

/**
 * Pembatalan pendaftaran oleh Mahasiswa.
 * Menggunakan RPC cancel_registration di database PostgreSQL:
 * - Hanya pendaftaran milik user sendiri yang bisa dibatalkan
 * - Hanya pendaftaran yang belum berstatus PAID yang bisa dibatalkan (BR-04)
 * - Kuota event otomatis bertambah kembali karena baris pendaftaran terhapus
 */
export async function cancelRegistrationAction(
  input: CancelRegistrationInput
): Promise<ActionResult<{ success: boolean }>> {
  const parsed = cancelRegistrationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input pembatalan tidak valid' }
  }

  const auth = await getAuthenticatedStudent()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  // Panggil fungsi database cancel_registration
  const { error } = await auth.supabase.rpc('cancel_registration', {
    p_registration_id: parsed.data.registrationId,
  })

  if (error) {
    return { ok: false, error: error.message || 'Gagal membatalkan pendaftaran' }
  }

  // Revalidasi halaman terkait
  revalidatePath('/events')
  revalidatePath('/my/registrations')
  revalidatePath('/dashboard')
  revalidatePath('/admin/registrations')

  return {
    ok: true,
    data: { success: true },
  }
}
