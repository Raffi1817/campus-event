'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { logoutAction } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  Loader2,
  Calendar,
  PlusCircle,
  Layers,
  Compass,
  LayoutDashboard,
  ClipboardList,
  Ticket,
  Bell,
  BarChart3,
  Home,
  ChevronDown,
  User,
  Users,
} from 'lucide-react'

interface NavbarProps {
  user: {
    fullName: string
    role: string
    email: string
  }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [isLoggingOut, startLogoutTransition] = useTransition()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user.role !== 'MAHASISWA') return

    const supabase = createClient()
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => {
        if (typeof count === 'number') {
          setUnreadCount(count)
        }
      })
  }, [user.role, pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction()
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login'
    })
  }

  const getRoleBadgeClass = () => {
    switch (user.role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
      case 'PANITIA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
    }
  }

  const getHomeLink = () => {
    if (user.role === 'ADMIN') return '/admin/dashboard'
    if (user.role === 'PANITIA') return '/panitia/dashboard'
    return '/dashboard'
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const navLinks = [
    {
      label: 'Dashboard',
      href: getHomeLink(),
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Jelajah Event',
      href: '/events',
      icon: Compass,
      show: user.role !== 'ADMIN',
    },
    {
      label: 'Pendaftaran Saya',
      href: '/my/registrations',
      icon: ClipboardList,
      show: user.role === 'MAHASISWA',
    },
    {
      label: 'Tiket Saya',
      href: '/my/tickets',
      icon: Ticket,
      show: user.role === 'MAHASISWA',
    },
    {
      label: 'Notifikasi',
      href: '/notifications',
      icon: Bell,
      show: user.role === 'MAHASISWA',
    },
    {
      label: 'Event Saya',
      href: '/panitia/events',
      icon: Calendar,
      show: user.role === 'PANITIA',
    },
    {
      label: 'Buat Event',
      href: '/panitia/events/new',
      icon: PlusCircle,
      show: user.role === 'PANITIA',
    },
    {
      label: 'Laporan',
      href: '/panitia/reports',
      icon: BarChart3,
      show: user.role === 'PANITIA',
    },
    {
      label: 'Semua Event',
      href: '/admin/events',
      icon: Calendar,
      show: user.role === 'ADMIN',
    },
    {
      label: 'Pendaftaran',
      href: '/admin/registrations',
      icon: ClipboardList,
      show: user.role === 'ADMIN',
    },
    {
      label: 'Kelola Kategori',
      href: '/admin/categories',
      icon: Layers,
      show: user.role === 'ADMIN',
    },
    {
      label: 'Kelola User',
      href: '/admin/users',
      icon: Users,
      show: user.role === 'ADMIN',
    },
    {
      label: 'Laporan',
      href: '/admin/reports',
      icon: BarChart3,
      show: user.role === 'ADMIN',
    },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={getHomeLink()} className="font-bold text-lg text-primary tracking-tight">
            CampusEvent
          </Link>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass()}`}>
            {user.role === 'MAHASISWA' ? 'Mahasiswa' : user.role === 'PANITIA' ? 'Panitia' : 'Admin'}
          </span>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => {
                const isActive = pathname === link.href || (link.href !== getHomeLink() && pathname.startsWith(link.href))
                const Icon = link.icon
                const isNotif = link.href === '/notifications' && unreadCount > 0
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      {isNotif && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <span>{link.label}</span>
                    {isNotif && (
                      <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Submenu / Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left cursor-pointer"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Menu Akun"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                {getInitials(user.fullName)}
              </div>
              <span className="hidden font-medium text-sm text-foreground leading-tight truncate max-w-[140px] lg:inline">
                {user.fullName}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card p-1.5 text-card-foreground shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass()}`}>
                      {user.role === 'MAHASISWA' ? 'Mahasiswa' : user.role === 'PANITIA' ? 'Panitia' : 'Admin'}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    <User className="h-4 w-4 text-primary" />
                    <span>Profil Saya</span>
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    <Home className="h-4 w-4 text-primary" />
                    <span>Halaman Beranda</span>
                  </Link>
                </div>

                <div className="my-1 border-t" />

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false)
                    handleLogout()
                  }}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 font-medium transition-colors disabled:opacity-50 text-left cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  ) : (
                    <LogOut className="h-4 w-4 text-destructive" />
                  )}
                  <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden border-t px-2 py-1.5 bg-muted/30 flex items-center gap-1 overflow-x-auto">
        <Link
          href="/"
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            pathname === '/'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="h-3.5 w-3.5" />
          <span>Beranda</span>
        </Link>
        {navLinks
          .filter((l) => l.show)
          .map((link) => {
            const isActive = pathname === link.href || (link.href !== getHomeLink() && pathname.startsWith(link.href))
            const Icon = link.icon
            const isNotif = link.href === '/notifications' && unreadCount > 0
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="h-3.5 w-3.5" />
                  {isNotif && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  )}
                </div>
                <span>{link.label}</span>
                {isNotif && (
                  <span className="ml-0.5 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold leading-none text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
      </div>
    </header>
  )
}
