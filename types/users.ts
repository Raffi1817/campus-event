import type { Database } from '@/types/database'

export type ManagedUser = Database['public']['Tables']['profiles']['Row'] & {
  active_events_count?: number
}
