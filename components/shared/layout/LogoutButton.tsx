'use client'

import { useTransition } from 'react'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  redirectTo?: string
  variant?: 'outline' | 'default' | 'ghost' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function LogoutButton({
  redirectTo = '/',
  variant = 'outline',
  size = 'default',
  className = 'gap-2 cursor-pointer',
}: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      window.location.href = redirectTo
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <LogOut className="h-4 w-4 text-muted-foreground" />
      )}
      <span>{isPending ? 'Keluar...' : 'Keluar'}</span>
    </Button>
  )
}
