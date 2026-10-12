import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/shared/layout'
import { NotificationsList } from '@/components/shared/notifications/NotificationsList'
import { AppNotification } from '@/types/notifications'

export const instant = false

export default async function NotificationsPage() {
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

  // Ambil seluruh notifikasi milik user aktif
  const { data: rawNotifications } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      type,
      title,
      message,
      event_id,
      is_read,
      created_at,
      event:events (
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const notifications = (rawNotifications || []) as unknown as AppNotification[]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile?.full_name || 'Pengguna',
          role: profile?.role || 'MAHASISWA',
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground mt-1">
            Pemberitahuan resmi terkait pendaftaran event, status pembayaran, dan tiket Anda.
          </p>
        </div>

        <NotificationsList initialNotifications={notifications} />
      </main>
    </div>
  )
}
