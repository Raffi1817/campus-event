import type { Database } from '@/types/database'
import type { Event } from './events'

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketInsert = Database['public']['Tables']['tickets']['Insert']
export type TicketUpdate = Database['public']['Tables']['tickets']['Update']

export type TicketStatus = Database['public']['Enums']['ticket_status']

export type CheckIn = Database['public']['Tables']['checkins']['Row']
export type CheckInInsert = Database['public']['Tables']['checkins']['Insert']

export interface TicketWithDetails extends Ticket {
  events?: Pick<Event, 'id' | 'title' | 'event_date' | 'start_time' | 'location'> | null
  checkins?: CheckIn | null
}
