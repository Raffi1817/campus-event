import type { UserRole } from '../types/auth.ts'

export interface NavItem {
  label: string
  href: string
  iconName?: string
  roles?: UserRole[]
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  // Mahasiswa
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['MAHASISWA'],
  },
  {
    label: 'Jelajah Event',
    href: '/events',
    roles: ['MAHASISWA', 'PANITIA', 'ADMIN'],
  },
  {
    label: 'Pendaftaran Saya',
    href: '/my/registrations',
    roles: ['MAHASISWA'],
  },
  {
    label: 'Tiket Saya',
    href: '/my/tickets',
    roles: ['MAHASISWA'],
  },
  // Panitia
  {
    label: 'Dashboard',
    href: '/panitia/dashboard',
    roles: ['PANITIA'],
  },
  {
    label: 'Event Saya',
    href: '/panitia/events',
    roles: ['PANITIA'],
  },
  {
    label: 'Buat Event',
    href: '/panitia/events/new',
    roles: ['PANITIA'],
  },
  // Admin
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    roles: ['ADMIN'],
  },
  {
    label: 'Semua Event',
    href: '/admin/events',
    roles: ['ADMIN'],
  },
  {
    label: 'Pendaftaran',
    href: '/admin/registrations',
    roles: ['ADMIN'],
  },
  {
    label: 'Kelola Kategori',
    href: '/admin/categories',
    roles: ['ADMIN'],
  },
  {
    label: 'Kelola User',
    href: '/admin/users',
    roles: ['ADMIN'],
  },
]
