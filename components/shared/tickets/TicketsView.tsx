'use client'

import { useState } from 'react'
import { TicketWithDetails } from '@/types/tickets'
import { TicketCard } from './TicketCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Ticket, History, ArrowRight, Sparkles } from 'lucide-react'

interface TicketsViewProps {
  tickets: TicketWithDetails[]
}

export function TicketsView({ tickets }: TicketsViewProps) {
  const activeTickets = tickets.filter((t) => t.status === 'ACTIVE')
  const historyTickets = tickets.filter((t) => t.status !== 'ACTIVE')

  const [activeTab, setActiveTab] = useState<'active' | 'history'>(
    activeTickets.length > 0 ? 'active' : 'history'
  )

  const currentList = activeTab === 'active' ? activeTickets : historyTickets

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>Tiket Aktif</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'active'
                ? 'bg-white/20 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {activeTickets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Riwayat Tiket</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'history'
                ? 'bg-white/20 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {historyTickets.length}
          </span>
        </button>
      </div>

      {/* Konten Tiket */}
      {currentList.length === 0 ? (
        <Card className="border-dashed py-12 text-center shadow-xs">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {activeTab === 'active' ? (
                <Sparkles className="h-7 w-7" />
              ) : (
                <History className="h-7 w-7" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold">
                {activeTab === 'active'
                  ? 'Tidak Ada Tiket Aktif'
                  : 'Belum Ada Riwayat Tiket'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeTab === 'active'
                  ? 'Anda tidak memiliki tiket yang siap digunakan saat ini. Daftarkan diri Anda ke event kampus seru lainnya!'
                  : 'Tiket yang telah digunakan (check-in) atau dibatalkan akan tercatat di bagian riwayat ini.'}
              </p>
            </div>
            {activeTab === 'active' && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link href="/events">
                  <Button size="sm" className="text-xs gap-1.5">
                    <span>Jelajah Event Kampus</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                {historyTickets.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setActiveTab('history')}
                  >
                    Lihat Riwayat Tiket ({historyTickets.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {currentList.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
