import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rute publik autentikasi
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // Jika belum login
  if (!user) {
    // Rute yang membutuhkan login
    const isProtected =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/panitia') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/events') ||
      pathname.startsWith('/my') ||
      pathname.startsWith('/notifications')

    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Jika sudah login, ambil profile (role & status aktif)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // User tidak aktif / dinonaktifkan oleh Admin
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'deactivated')
    return NextResponse.redirect(url)
  }

  const role = profile.role

  // Helper untuk redirect dashboard sesuai role
  const getDefaultDashboard = () => {
    if (role === 'ADMIN') return '/admin/dashboard'
    if (role === 'PANITIA') return '/panitia/dashboard'
    return '/dashboard'
  }

  // Jika mengakses /login atau /register padahal sudah login, alihkan ke dashboard masing-masing
  if (isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultDashboard()
    return NextResponse.redirect(url)
  }

  // Jika mengakses root '/' alihkan sesuai login
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultDashboard()
    return NextResponse.redirect(url)
  }

  // Proteksi rute Admin: hanya role ADMIN
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultDashboard()
    return NextResponse.redirect(url)
  }

  // Proteksi rute Panitia: hanya PANITIA atau ADMIN
  if (pathname.startsWith('/panitia') && role !== 'PANITIA' && role !== 'ADMIN') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
