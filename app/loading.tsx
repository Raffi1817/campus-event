import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Loader2 className="h-5 w-5 text-primary absolute animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground tracking-tight">Memuat Data...</p>
          <p className="text-xs text-muted-foreground">Menghubungkan ke sistem CampusEvent</p>
        </div>
      </div>
    </div>
  )
}
