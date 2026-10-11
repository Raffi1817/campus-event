import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { EventForm } from '@/components/event-form'
import { EventStatus } from '@/lib/validators/events'

export const instant = false

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  await connection()
  const { id } = await params
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

  if (!profile || (profile.role !== 'PANITIA' && profile.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  // Ambil data event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // Panitia hanya boleh mengedit event miliknya
  if (profile.role === 'PANITIA' && event.organizer_id !== user.id) {
    redirect('/panitia/events')
  }

  // Ambil daftar kategori
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: profile.full_name,
          role: profile.role,
          email: user.email || '',
        }}
      />
      <main className="container mx-auto p-4 md:p-6">
        <EventForm
          categories={categories || []}
          initialData={{
            ...event,
            status: event.status as EventStatus,
          }}
          isEditMode={true}
        />
      </main>
    </div>
  )
}
