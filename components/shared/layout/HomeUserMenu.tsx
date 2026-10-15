'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { logoutAction } from '@/lib/actions/auth'
import Link from 'next/link'
import { LayoutDashboard, LogOut, Loader2, ChevronDown, User } from 'lucide-react'

interface HomeUserMenuProps {
  user: {
    fullName: string
    email: string
    role: string
    dashboardUrl: string
  }
}

export function HomeUserMenu({ user }: HomeUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, startLogoutTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction()
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/'
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

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu Pengguna"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
          {getInitials(user.fullName)}
        </div>
        <span className="hidden font-medium text-sm text-foreground leading-tight truncate max-w-[140px] md:inline">
          {user.fullName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card p-1.5 text-card-foreground shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="mt-1.5">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass()}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted font-medium transition-colors"
            >
              <User className="h-4 w-4 text-primary" />
              <span>Profil Saya</span>
            </Link>
            <Link
              href={user.dashboardUrl}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted font-medium transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <span>Buka Dashboard</span>
            </Link>
          </div>

          <div className="my-1 border-t" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
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
  )
}
