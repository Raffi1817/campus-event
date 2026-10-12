import type { Database } from '@/types/database'
import type { Event } from './events'
import type { Profile } from './auth'

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketInsert = Database['public']['Tables']['tickets']['Insert']
export type TicketUpdate = Database['public']['Tables']['tickets']['Update']

export type TicketStatus = Database['public']['Enums']['ticket_status']

export type CheckIn = Database['public']['Tables']['checkins']['Row']
export type CheckInInsert = Database['public']['Tables']['checkins']['Insert']

export interface TicketEventDetail
  extends Pick<
    Event,
    'id' | 'title' | 'event_date' | 'start_time' | 'location' | 'price' | 'status' | 'poster_url'
  > {
  end_time?: string | null
  category?: { name: string } | null
  organizer?: { full_name: string } | null
}

export interface TicketStudentDetail
  extends Pick<Profile, 'id' | 'full_name' | 'email'> {
  nim?: string | null
}

export interface TicketRegistrationDetail {
  id: string
  user_id: string
  event?: TicketEventDetail | null
  student?: TicketStudentDetail | null
}

export interface TicketWithDetails extends Ticket {
  registration?: TicketRegistrationDetail | null
  checkins?: CheckIn | CheckIn[] | null
}
