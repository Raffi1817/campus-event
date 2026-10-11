import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Navbar } from '@/components/navbar'
import { EventForm } from '@/components/event-form'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export const instant = false

export default async function NewEventPage() {
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

  if (!profile || profile.role !== 'PANITIA') {
    redirect('/dashboard')
  }

  // Ambil daftar kategori yang tersedia
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
        {!categories || categories.length === 0 ? (
          <Card className="max-w-xl mx-auto border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                  Belum Ada Kategori Tersedia
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Untuk membuat event, sistem membutuhkan setidaknya satu kategori aktif. Silakan hubungi
                  Administrator untuk menambahkan kategori event terlebih dahulu.
                </p>
                <Link
                  href="/panitia/events"
                  className="inline-block text-sm font-medium text-amber-900 underline dark:text-amber-200"
                >
                  Kembali ke Daftar Event
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EventForm categories={categories} isEditMode={false} />
        )}
      </main>
    </div>
  )
}
