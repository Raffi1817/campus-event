import type { Database } from '@/types/database'

export type UserRole = Database['public']['Enums']['user_role']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface SessionUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  nim?: string | null
  isActive: boolean
}
