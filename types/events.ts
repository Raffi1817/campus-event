import type { Database } from '@/types/database'

export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type EventWithStats = Database['public']['Views']['events_with_stats']['Row']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type EventStatus = Database['public']['Enums']['event_status']

export interface EventFilterOptions {
  categoryId?: string
  search?: string
  status?: EventStatus
}
