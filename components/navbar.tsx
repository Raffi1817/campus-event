'use client'

import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogOut, Calendar } from 'lucide-react'

interface NavbarProps {
  user: {
    fullName: string
    role: string
    email: string
  }
}

export function Navbar({ user }: NavbarProps) {
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={getHomeLink()} className="flex items-center gap-2 font-bold text-lg text-primary">
            <Calendar className="h-5 w-5" />
            <span>CampusEvent</span>
          </Link>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass()}`}>
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right text-sm sm:block">
            <div className="font-medium text-foreground">{user.fullName}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
