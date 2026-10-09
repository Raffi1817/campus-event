import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { EventCatalog } from '@/components/event-catalog'

export const instant = false

export default async function EventsCatalogPage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Ambil daftar event aktif beserta statistik (remaining_quota, organizer_name, category_name)
  const { data: events } = await supabase
    .from('events_with_stats')
    .select('*')
    .order('event_date', { ascending: true })

  // Ambil semua kategori untuk filter
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile?.full_name || 'Pengguna',
          role: profile?.role || 'MAHASISWA',
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6">
        <EventCatalog
          events={events || []}
          categories={categories || []}
        />
      </main>
    </div>
  )
}
