import type { Database } from '@/types/database'

export type TicketStatus = Database['public']['Enums']['ticket_status']

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  ACTIVE: 'Aktif',
  USED: 'Sudah Digunakan',
  CANCELLED: 'Dibatalkan',
}

export const TICKET_STATUS_BADGE_VARIANTS: Record<
  TicketStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ACTIVE: 'default',
  USED: 'secondary',
  CANCELLED: 'destructive',
}
