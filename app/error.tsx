'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error secara internal di konsol browser
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md border-border/80 text-center">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Terjadi Kendala Sistem
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Maaf, kami mengalami kendala saat memproses permintaan Anda. Silakan coba kembali atau kembali ke beranda.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground bg-muted/50 rounded-md py-1 px-2 inline-block">
              Kode Error: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button onClick={() => reset()} className="w-full sm:w-auto gap-1.5 text-xs h-9">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto gap-1.5 text-xs h-9">
              <Home className="h-3.5 w-3.5" />
              <span>Ke Halaman Utama</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
