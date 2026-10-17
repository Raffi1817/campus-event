import { Badge } from '@/components/ui/badge'
import { EVENT_STATUS_LABELS, EVENT_STATUS_BADGE_VARIANTS, type EventStatus } from '@/constants/events'

interface EventStatusBadgeProps {
  status: string | null | undefined
  className?: string
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  if (!status) return null

  const validStatus = status as EventStatus
  const label = EVENT_STATUS_LABELS[validStatus] || status
  const variant = EVENT_STATUS_BADGE_VARIANTS[validStatus] || 'secondary'

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
