'use server'

import { createClient } from '@/lib/supabase/server'
import { eventFormSchema, EventFormInput, eventStatusSchema, EventStatus } from '@/lib/validators/events'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Helper untuk verifikasi user login dan mendapatkan profilnya.
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
    .select('role, is_active, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.is_active) {
    return { error: 'Akun tidak valid atau telah dinonaktifkan' }
  }

  return { supabase, user, profile }
}

/**
 * Membuat event baru (Khusus Panitia)
 * Status awal otomatis 'DRAFT'
 */
export async function createEventAction(input: EventFormInput): Promise<ActionResult<{ id: string }>> {
  const parsed = eventFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input formulir tidak valid' }
  }

  const auth = await getAuthenticatedUser()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  // Hanya Panitia yang boleh membuat event (berdasarkan matriks hak akses)
  if (auth.profile?.role !== 'PANITIA') {
    return { ok: false, error: 'Hanya Panitia yang diizinkan membuat event baru' }
  }

  // Validasi: tanggal event tidak boleh di masa lalu saat membuat event (WIB)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  if (parsed.data.event_date < todayStr) {
    return { ok: false, error: 'Tanggal event tidak boleh di masa lalu' }
  }

  const { data, error } = await auth.supabase
    .from('events')
    .insert({
      organizer_id: auth.user.id,
      category_id: parsed.data.category_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time || null,
      location: parsed.data.location,
      quota: parsed.data.quota,
      price: parsed.data.price,
      poster_url: parsed.data.poster_url || null,
      status: 'DRAFT',
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message || 'Gagal membuat event' }
  }

  revalidatePath('/panitia/events')
  revalidatePath('/admin/events')
  revalidatePath('/events')

  return { ok: true, data: { id: data.id } }
}

/**
 * Memperbarui rincian event (Panitia pemilik atau Admin)
 */
export async function updateEventAction(
  eventId: string,
  input: EventFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = eventFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input formulir tidak valid' }
  }

  const auth = await getAuthenticatedUser()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  // Cek keberadaan event & izin
  const { data: existingEvent, error: fetchError } = await auth.supabase
    .from('events')
    .select('id, organizer_id, status')
    .eq('id', eventId)
    .single()

  if (fetchError || !existingEvent) {
    return { ok: false, error: 'Event tidak ditemukan' }
  }

  const isAdmin = auth.profile?.role === 'ADMIN'
  const isOwner = existingEvent.organizer_id === auth.user.id

  if (!isAdmin && !isOwner) {
    return { ok: false, error: 'Anda tidak memiliki hak untuk mengubah event ini' }
  }

  if (existingEvent.status === 'COMPLETED' || existingEvent.status === 'CANCELLED') {
    return { ok: false, error: 'Event yang sudah selesai atau dibatalkan tidak dapat diubah' }
  }

  const { data, error } = await auth.supabase
    .from('events')
    .update({
      category_id: parsed.data.category_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time || null,
      location: parsed.data.location,
      quota: parsed.data.quota,
      price: parsed.data.price,
      poster_url: parsed.data.poster_url || null,
    })
    .eq('id', eventId)
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message || 'Gagal memperbarui event' }
  }

  revalidatePath('/panitia/events')
  revalidatePath(`/panitia/events/${eventId}/edit`)
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)

  return { ok: true, data: { id: data.id } }
}

/**
 * Mengubah status event sesuai alur resmi:
 * DRAFT -> PUBLISHED -> ONGOING -> COMPLETED / CANCELLED
 */
export async function updateEventStatusAction(
  eventId: string,
  newStatus: EventStatus
): Promise<ActionResult<{ status: EventStatus }>> {
  const parsedStatus = eventStatusSchema.safeParse(newStatus)
  if (!parsedStatus.success) {
    return { ok: false, error: 'Status event tidak valid' }
  }

  const auth = await getAuthenticatedUser()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  const { data: existingEvent, error: fetchError } = await auth.supabase
    .from('events')
    .select('id, organizer_id, status')
    .eq('id', eventId)
    .single()

  if (fetchError || !existingEvent) {
    return { ok: false, error: 'Event tidak ditemukan' }
  }

  const isAdmin = auth.profile?.role === 'ADMIN'
  const isOwner = existingEvent.organizer_id === auth.user.id

  if (!isAdmin && !isOwner) {
    return { ok: false, error: 'Anda tidak memiliki hak untuk mengubah status event ini' }
  }

  const { error } = await auth.supabase
    .from('events')
    .update({ status: parsedStatus.data })
    .eq('id', eventId)

  if (error) {
    return { ok: false, error: error.message || 'Gagal mengubah status event' }
  }

  revalidatePath('/panitia/events')
  revalidatePath(`/panitia/events/${eventId}/edit`)
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)

  return { ok: true, data: { status: parsedStatus.data } }
}

/**
 * Menghapus event (Hanya diperbolehkan bila status masih 'DRAFT')
 */
export async function deleteDraftEventAction(eventId: string): Promise<ActionResult<{ success: boolean }>> {
  const auth = await getAuthenticatedUser()
  if (auth.error || !auth.supabase || !auth.user) {
    return { ok: false, error: auth.error || 'Autentikasi gagal' }
  }

  const { data: existingEvent, error: fetchError } = await auth.supabase
    .from('events')
    .select('id, organizer_id, status')
    .eq('id', eventId)
    .single()

  if (fetchError || !existingEvent) {
    return { ok: false, error: 'Event tidak ditemukan' }
  }

  const isAdmin = auth.profile?.role === 'ADMIN'
  const isOwner = existingEvent.organizer_id === auth.user.id

  if (!isAdmin && !isOwner) {
    return { ok: false, error: 'Anda tidak memiliki hak untuk menghapus event ini' }
  }

  if (existingEvent.status !== 'DRAFT') {
    return { ok: false, error: 'Hanya event dengan status DRAFT yang dapat dihapus' }
  }

  const { error } = await auth.supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    return { ok: false, error: error.message || 'Gagal menghapus event' }
  }

  revalidatePath('/panitia/events')
  revalidatePath('/admin/events')
  revalidatePath('/events')

  return { ok: true, data: { success: true } }
}
