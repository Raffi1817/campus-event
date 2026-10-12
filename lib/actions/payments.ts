'use server'

import { createClient } from '@/lib/supabase/server'
import {
  payRegistrationSchema,
  confirmPaymentSchema,
  PayRegistrationInput,
  ConfirmPaymentInput,
} from '@/lib/validators/payments'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Helper untuk verifikasi sesi user login dan mendapatkan profilnya.
 */
async function getAuthenticatedUser() {
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

  return { supabase, user, profile }
}

/**
 * Mahasiswa melakukan pembayaran (simulasi).
 * Menggunakan RPC pay_registration di database PostgreSQL:
 * - TRANSFER_BANK / E_WALLET -> langsung PAID, tiket terbit otomatis, notifikasi dikirim.
 * - CASH -> tetap PENDING, menunggu konfirmasi panitia di lokasi.
 * - Pendaftaran berstatus FAILED diperbolehkan bayar ulang.
 */
export async function payRegistrationAction(
  input: PayRegistrationInput
): Promise<ActionResult<{ status: 'PAID' | 'PENDING' }>> {
  const parsed = payRegistrationSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Input pembayaran tidak valid',
    }
  }

  const auth = await getAuthenticatedUser()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  if (auth.profile?.role !== 'MAHASISWA') {
    return { ok: false, error: 'Hanya akun Mahasiswa yang dapat melakukan pembayaran' }
  }

  // Panggil RPC pay_registration di database
  const { data, error } = await auth.supabase.rpc('pay_registration', {
    p_registration_id: parsed.data.registrationId,
    p_method: parsed.data.method,
  })

  if (error) {
    return { ok: false, error: error.message || 'Gagal memproses pembayaran' }
  }

  const paymentStatus = data as 'PAID' | 'PENDING'

  // Revalidasi halaman terkait
  revalidatePath('/my/registrations')
  revalidatePath('/my/tickets')
  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath('/admin/registrations')

  return {
    ok: true,
    data: {
      status: paymentStatus,
    },
  }
}

/**
 * Panitia pemilik event atau Admin mengonfirmasi atau menolak pembayaran PENDING (mis. Cash).
 * Menggunakan RPC confirm_payment di database PostgreSQL:
 * - p_approve = true  -> status jadi PAID, tiket terbit otomatis, notifikasi terkirim.
 * - p_approve = false -> status jadi FAILED, notifikasi penolakan terkirim, mahasiswa boleh bayar ulang.
 */
export async function confirmPaymentAction(
  input: ConfirmPaymentInput
): Promise<ActionResult<{ status: 'PAID' | 'FAILED' }>> {
  const parsed = confirmPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Input konfirmasi tidak valid',
    }
  }

  const auth = await getAuthenticatedUser()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  const role = auth.profile?.role
  if (role !== 'PANITIA' && role !== 'ADMIN') {
    return { ok: false, error: 'Anda tidak memiliki hak akses untuk mengonfirmasi pembayaran' }
  }

  // Panggil RPC confirm_payment di database
  const { data, error } = await auth.supabase.rpc('confirm_payment', {
    p_registration_id: parsed.data.registrationId,
    p_approve: parsed.data.approve,
  })

  if (error) {
    return { ok: false, error: error.message || 'Gagal mengonfirmasi pembayaran' }
  }

  const paymentStatus = data as 'PAID' | 'FAILED'

  // Revalidasi halaman terkait
  revalidatePath('/panitia/events')
  revalidatePath('/panitia/dashboard')
  revalidatePath('/admin/registrations')
  revalidatePath('/my/registrations')
  revalidatePath('/my/tickets')
  revalidatePath('/dashboard')

  return {
    ok: true,
    data: {
      status: paymentStatus,
    },
  }
}
