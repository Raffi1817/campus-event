import Image from 'next/image'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center animate-in fade-in duration-300">
        {/* Animated Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute -inset-2 rounded-full bg-primary/20 blur-lg animate-pulse" />

          {/* Rotating Spinner Ring */}
          <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />

          {/* Logo Badge in Center */}
          <div className="absolute flex items-center justify-center h-11 w-11 rounded-full bg-background/90 backdrop-blur-xs shadow-xs border border-border/60">
            <Image
              src="/icon.png"
              alt="CampusEvent Logo"
              width={26}
              height={26}
              priority
              className="object-contain animate-pulse"
            />
          </div>
        </div>

        {/* Text Status */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground tracking-tight">Memuat Data...</p>
          <p className="text-xs text-muted-foreground">Menghubungkan ke sistem CampusEvent</p>
        </div>
      </div>
    </div>
  )
}

