'use client'

import { useState, useTransition } from 'react'
import { AppNotification, NotificationType } from '@/types/notifications'
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/lib/actions/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Bell,
  CheckCheck,
  Check,
  CreditCard,
  Ticket,
  ClipboardList,
  AlertCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Calendar,
} from 'lucide-react'

interface NotificationsListProps {
  initialNotifications: AppNotification[]
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')
  const [isPending, startTransition] = useTransition()
  const [readingId, setReadingId] = useState<string | null>(null)

  const unreadCount = initialNotifications.filter((n) => !n.is_read).length

  const filteredNotifications = initialNotifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read
    if (filter === 'READ') return n.is_read
    return true
  })

  const handleMarkAsRead = (id: string) => {
    setReadingId(id)
    startTransition(async () => {
      const res = await markNotificationAsReadAction(id)
      setReadingId(null)
      if (!res.ok) {
        toast.error(res.error)
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsAsReadAction()
      if (!res.ok) {
        toast.error(res.error)
      }
    })
  }

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'REGISTRATION':
        return (
          <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
            <ClipboardList className="h-3 w-3" />
            <span>Pendaftaran</span>
          </Badge>
        )
      case 'PAYMENT':
        return (
          <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CreditCard className="h-3 w-3" />
            <span>Pembayaran</span>
          </Badge>
        )
      case 'TICKET':
        return (
          <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
            <Ticket className="h-3 w-3" />
            <span>Tiket</span>
          </Badge>
        )
      case 'EVENT_UPDATE':
        return (
          <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="h-3 w-3" />
            <span>Pembaruan</span>
          </Badge>
        )
      case 'EVENT_CANCELLED':
        return (
          <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300">
            <XCircle className="h-3 w-3" />
            <span>Dibatalkan</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Bell className="h-3 w-3" />
            <span>Info</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Kontrol & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('ALL')}
            className="text-xs"
          >
            Semua ({initialNotifications.length})
          </Button>
          <Button
            variant={filter === 'UNREAD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('UNREAD')}
            className="text-xs gap-1.5"
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center bg-primary-foreground text-primary text-[10px] font-bold h-4 w-4 rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant={filter === 'READ' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('READ')}
            className="text-xs"
          >
            Sudah Dibaca
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="gap-2 text-xs"
          >
            {isPending && !readingId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
            )}
            <span>Tandai Semua Dibaca</span>
          </Button>
        )}
      </div>

      {/* Daftar Notifikasi */}
      {filteredNotifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Tidak Ada Notifikasi</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {filter === 'UNREAD'
                ? 'Semua notifikasi Anda sudah dibaca.'
                : 'Belum ada notifikasi terkait event, pembayaran, atau tiket saat ini.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isItemPending = isPending && readingId === notif.id
            return (
              <Card
                key={notif.id}
                className={`transition-colors ${
                  !notif.is_read
                    ? 'border-primary/40 bg-primary/[0.02] dark:bg-primary/[0.04]'
                    : 'bg-card opacity-85'
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTypeBadge(notif.type)}
                        {!notif.is_read && (
                          <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Baru
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-base tracking-tight text-foreground">
                          {notif.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {notif.event && (
                        <div className="pt-1 flex items-center gap-1.5 text-xs text-primary font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Terkait Event:</span>
                          <Link
                            href={`/events/${notif.event.id}`}
                            className="underline hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                          >
                            <span>{notif.event.title}</span>
                            <ExternalLink className="h-3 w-3 inline" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {!notif.is_read && (
                      <div className="self-end sm:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notif.id)}
                          disabled={isItemPending}
                          className="gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
                        >
                          {isItemPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Tandai Dibaca</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
