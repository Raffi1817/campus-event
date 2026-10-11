'use client'

import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Calendar, PlusCircle, Layers, Compass, LayoutDashboard } from 'lucide-react'

interface NavbarProps {
  user: {
    fullName: string
    role: string
    email: string
  }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const getRoleBadgeClass = () => {
    switch (user.role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
      case 'PANITIA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    }
  }

  const getHomeLink = () => {
    if (user.role === 'ADMIN') return '/admin/dashboard'
    if (user.role === 'PANITIA') return '/panitia/dashboard'
    return '/dashboard'
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
      show: true,
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
      label: 'Semua Event',
      href: '/admin/events',
      icon: Calendar,
      show: user.role === 'ADMIN',
    },
    {
      label: 'Kelola Kategori',
      href: '/admin/categories',
      icon: Layers,
      show: user.role === 'ADMIN',
    },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={getHomeLink()} className="flex items-center gap-2 font-bold text-lg text-primary">
            <Calendar className="h-5 w-5" />
            <span className="hidden sm:inline">CampusEvent</span>
          </Link>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass()}`}>
            {user.role}
          </span>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((l) => l.show)
              .map((link) => {
                const isActive = pathname === link.href || (link.href !== getHomeLink() && pathname.startsWith(link.href))
                const Icon = link.icon
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
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right text-sm lg:block">
            <div className="font-medium text-foreground">{user.fullName}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden border-t px-2 py-1.5 bg-muted/30 flex items-center gap-1 overflow-x-auto">
        {navLinks
          .filter((l) => l.show)
          .map((link) => {
            const isActive = pathname === link.href || (link.href !== getHomeLink() && pathname.startsWith(link.href))
            const Icon = link.icon
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
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
      </div>
    </header>
  )
}
