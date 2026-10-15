import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { UserManager } from '@/components/shared/admin'
import { ManagedUser } from '@/types'

export const instant = false

export default async function AdminUsersPage() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'ADMIN' || !currentProfile.is_active) {
    redirect('/dashboard')
  }

  // Ambil semua profil pengguna dari database
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Ambil event berstatus aktif (DRAFT, PUBLISHED, ONGOING) untuk menghitung tanggungan event panitia
  const { data: activeEvents } = await supabase
    .from('events')
    .select('organizer_id')
    .in('status', ['DRAFT', 'PUBLISHED', 'ONGOING'])

  const activeEventCounts: Record<string, number> = {}
  activeEvents?.forEach((e) => {
    activeEventCounts[e.organizer_id] = (activeEventCounts[e.organizer_id] || 0) + 1
  })

  const managedUsers: ManagedUser[] = (profiles || []).map((p) => ({
    ...p,
    active_events_count: activeEventCounts[p.id] || 0,
  }))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: currentProfile.full_name,
          role: currentProfile.role,
          email: user.email || '',
        }}
      />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <UserManager initialUsers={managedUsers} currentAdminId={user.id} />
      </main>
    </div>
  )
}
