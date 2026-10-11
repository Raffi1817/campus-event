'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format'
import Link from 'next/link'
import { Search, Calendar, MapPin, Users, Ticket, ArrowRight, Layers } from 'lucide-react'
import { Database } from '@/types/database'

export type EventItem = Database['public']['Views']['events_with_stats']['Row']

interface CategoryOption {
  id: string
  name: string
}

interface EventCatalogProps {
  events: EventItem[]
  categories: CategoryOption[]
}

export function EventCatalog({ events, categories }: EventCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Hanya tampilkan event non-draft di katalog publik
      if (ev.status === 'DRAFT') return false

      const titleMatch = (ev.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      const locationMatch = (ev.location || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchQuery = titleMatch || locationMatch

      const matchCategory =
        selectedCategory === 'ALL' || ev.category_id === selectedCategory

      return matchQuery && matchCategory
    })
  }, [events, searchQuery, selectedCategory])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Pendaftaran Dibuka</Badge>
      case 'ONGOING':
        return <Badge variant="info">Sedang Berlangsung</Badge>
      case 'COMPLETED':
        return <Badge variant="muted">Selesai</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jelajah Event Kampus</h1>
          <p className="text-muted-foreground mt-1">
            Temukan seminar, workshop, kompetisi, dan berbagai kegiatan menarik di kampus Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama event atau lokasi..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Katalog Event */}
      {filteredEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Tidak Ada Event Ditemukan</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Tidak ada event yang cocok dengan kriteria pencarian atau kategori ini.'
                : 'Belum ada event yang dibuka untuk umum saat ini. Silakan periksa kembali nanti.'}
            </p>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
                }}
              >
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => {
            const isFull = (ev.remaining_quota ?? 0) <= 0
            return (
              <Card
                key={ev.id || ev.title || 'event'}
                className="overflow-hidden flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div>
                  {/* Poster Header atau Fallback Banner */}
                  <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-indigo-500/20 via-primary/10 to-purple-500/20 flex items-center justify-center overflow-hidden border-b">
                    {ev.poster_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={ev.poster_url}
                        alt={ev.title || 'Poster Event'}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center p-4">
                        <Ticket className="h-10 w-10 text-primary/40 mb-1" />
                        <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                          {ev.category_name || 'Event Kampus'}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {getStatusBadge(ev.status || '')}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="inline-block bg-background/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-primary shadow-sm">
                        {ev.price === 0 ? 'Gratis' : formatCurrency(ev.price ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        {ev.category_name} · Penyelenggara: {ev.organizer_name}
                      </div>
                      <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {ev.title}
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          {formatDate(ev.event_date || '')} · {formatTime(ev.start_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between py-2 border-t text-xs mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Sisa Kuota:</span>
                    </div>
                    <div>
                      {isFull ? (
                        <span className="font-semibold text-destructive">Kuota Penuh</span>
                      ) : (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {ev.remaining_quota} kursi
                        </span>
                      )}
                    </div>
                  </div>

                  <Link href={`/events/${ev.id}`} className="block">
                    <Button className="w-full gap-1.5 text-xs h-8">
                      <span>Lihat Rincian Event</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
