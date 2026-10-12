import type { Database } from '@/types/database'
import type { Event } from './events'
import type { Payment } from './payment'
import type { Profile } from './auth'

export type Registration = Database['public']['Tables']['registrations']['Row']
export type RegistrationInsert = Database['public']['Tables']['registrations']['Insert']
export type RegistrationUpdate = Database['public']['Tables']['registrations']['Update']

export interface RegistrationEventDetail
  extends Pick<
    Event,
    'id' | 'title' | 'event_date' | 'start_time' | 'location' | 'price' | 'status' | 'poster_url'
  > {
  end_time?: string | null
  category?: { name: string } | null
  organizer?: { full_name: string } | null
}

export interface RegistrationPaymentDetail
  extends Pick<Payment, 'id' | 'amount' | 'status' | 'method'> {
  paid_at?: string | null
}

export interface RegistrationStudentDetail
  extends Pick<Profile, 'id' | 'full_name' | 'email'> {
  nim?: string | null
}

export interface RegistrationWithEvent extends Registration {
  // Dukungan untuk relasi singular (alias di Supabase select 'event:events(...)')
  event?: RegistrationEventDetail | null
  // Dukungan untuk relasi plural bawaan Supabase ('events(...)')
  events?: RegistrationEventDetail | null
  // Dukungan untuk data pembayaran singular dan plural
  payment?: RegistrationPaymentDetail | null
  payments?: RegistrationPaymentDetail | null
  // Dukungan untuk relasi profil mahasiswa
  student?: RegistrationStudentDetail | null
}

export type RegistrationItem = RegistrationWithEvent
export type AdminRegistrationItem = RegistrationWithEvent
