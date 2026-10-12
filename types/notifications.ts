import { Database } from './database'

export type NotificationType = Database['public']['Enums']['notification_type']

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  event_id: string | null
  is_read: boolean
  created_at: string
  event?: {
    id: string
    title: string
  } | null
}
