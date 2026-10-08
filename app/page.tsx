import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Calendar, ArrowRight, ShieldCheck, Ticket, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <Calendar className="h-6 w-6" />
            <span>CampusEvent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
              Masuk
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            Platform Resmi Manajemen Event Kampus
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
            Temukan dan Ikuti Berbagai <br className="hidden sm:inline" />
            <span className="text-primary">Event Kampus Terbaik</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Satu sistem terintegrasi untuk mahasiswa, panitia pelaksana, dan administrator kampus.
            Daftar seminar, workshop, kompetisi, dan dapatkan tiket digital secara instan.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className={buttonVariants({ size: 'lg', className: 'gap-2 text-base' })}>
              Mulai Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'text-base' })}>
              Masuk ke Akun
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Ticket className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Tiket Digital Instan</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tiket dengan kode unik otomatis terbit setelah verifikasi pembayaran. Praktis untuk check-in di lokasi.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Khusus Panitia</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Kelola kuota peserta, pantau bukti transaksi, serta verifikasi kehadiran secara real-time.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Akses Berjenjang (RBAC)</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Didukung Row-Level Security (RLS) PostgreSQL untuk memisahkan wewenang Mahasiswa, Panitia, dan Admin.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-background">
        <p>&copy; 2026 CampusEvent. Sistem Manajemen Event Kampus.</p>
      </footer>
    </div>
  )
}
