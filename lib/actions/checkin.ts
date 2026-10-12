'use server'

import { createClient } from '@/lib/supabase/server'
import { checkInSchema, CheckInInput } from '@/lib/validators/checkin'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export interface CheckInSuccessData {
  participant_name: string
  ticket_code: string
  event_title: string
}

/**
 * Helper untuk verifikasi sesi staf (Panitia atau Admin)
 */
async function getAuthenticatedStaff() {
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
    .select('id, role, is_active, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_active) {
    return { error: 'Akun tidak valid atau telah dinonaktifkan' }
  }

  if (profile.role !== 'PANITIA' && profile.role !== 'ADMIN') {
    return { error: 'Hanya Panitia dan Admin yang memiliki akses check-in' }
  }

  return { supabase, user, profile }
}

/**
 * Panitia / Admin melakukan check-in peserta menggunakan kode tiket unik.
 * Menggunakan RPC check_in di database PostgreSQL:
 * - Memverifikasi bahwa pemanggil adalah admin atau panitia pemilik event
 * - Memverifikasi status event adalah ONGOING (D8)
 * - Memverifikasi tiket terdaftar untuk event yang bersangkutan
 * - Memverifikasi tiket belum pernah digunakan (USED) dan belum dibatalkan (CANCELLED)
 * - Memverifikasi pembayaran peserta telah berstatus PAID
 * - Mengubah status tiket menjadi USED dan mencatat baris kehadiran di tabel checkins secara atomik
 */
export async function checkInAction(
  input: CheckInInput
): Promise<ActionResult<CheckInSuccessData>> {
  const parsed = checkInSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Input kode tiket tidak valid',
    }
  }

  const auth = await getAuthenticatedStaff()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  // Panggil RPC check_in di PostgreSQL
  const { data, error } = await auth.supabase.rpc('check_in', {
    p_ticket_code: parsed.data.ticketCode,
    p_event_id: parsed.data.eventId,
  })

  if (error) {
    return {
      ok: false,
      error: error.message || 'Gagal melakukan check-in peserta',
    }
  }

  const result = data as unknown as CheckInSuccessData

  // Revalidasi cache halaman terkait
  revalidatePath(`/panitia/events/${parsed.data.eventId}/checkin`)
  revalidatePath(`/panitia/events/${parsed.data.eventId}/participants`)
  revalidatePath('/panitia/events')
  revalidatePath('/panitia/dashboard')
  revalidatePath('/admin/events')
  revalidatePath('/admin/registrations')
  revalidatePath('/my/tickets')

  return {
    ok: true,
    data: result,
  }
}
