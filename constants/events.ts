import type { Database } from '@/types/database'

export type EventStatus = Database['public']['Enums']['event_status']

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Dipublikasikan',
  ONGOING: 'Sedang Berlangsung',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

export const EVENT_STATUS_BADGE_VARIANTS: Record<
  EventStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'secondary',
  PUBLISHED: 'default',
  ONGOING: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
}

export const EVENT_LIMITS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 150,
  MIN_LOCATION_LENGTH: 2,
  MAX_LOCATION_LENGTH: 200,
  MIN_QUOTA: 1,
} as const
