import Link from 'next/link'
import { LayoutDashboard, Zap } from 'lucide-react'

export default function NotFound() {
  const dashboardUrl = '/dashboard'

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-[#14172B] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background glow using Primer Soft & Kuning Tiket */}
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[540px] h-[320px] bg-[#DCE3F7]/50 dark:bg-[#243B9B]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[380px] h-[220px] bg-[#FFD23F]/20 dark:bg-[#FFD23F]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl text-center relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Tag / Pill (Biru Almamater + Kuning Tiket) */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E1E4EE] bg-white dark:bg-[#121F55] dark:border-[#243B9B] px-4 py-1.5 text-xs font-semibold text-[#243B9B] dark:text-[#FFD23F] shadow-xs mb-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD23F] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E07A00]" />
          </span>
          <span className="tracking-wide">ERROR 404 · Page Connection Lost</span>
        </div>

        {/* Hero Visual: 404 Watermark + Disconnected Cables with Electricity Animation */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Big background 404 watermark */}
          <span className="text-[120px] sm:text-[170px] font-black text-[#DCE3F7]/80 dark:text-[#121F55]/80 tracking-widest select-none pointer-events-none leading-none font-mono">
            404
          </span>

          {/* Disconnected wire & electrical animation SVG */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 440 130"
              className="w-full max-w-[360px] sm:max-w-[460px] h-auto drop-shadow-md overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glow filter for electric sparks */}
                <filter id="electric-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <style>{`
                @keyframes pulseCurrentLeft {
                  0% { stroke-dashoffset: 80; }
                  100% { stroke-dashoffset: 0; }
                }
                @keyframes pulseCurrentRight {
                  0% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: 80; }
                }
                @keyframes electricZapPrimary {
                  0%, 100% { opacity: 0; transform: scaleY(0.7); }
                  8% { opacity: 1; transform: scaleY(1.1); }
                  14% { opacity: 0.2; }
                  20% { opacity: 1; transform: scaleY(1); }
                  28% { opacity: 0; }
                  50% { opacity: 0; }
                  55% { opacity: 0.9; transform: scaleY(1.2); }
                  62% { opacity: 0.3; }
                  70% { opacity: 1; }
                  76% { opacity: 0; }
                }
                @keyframes electricZapSecondary {
                  0%, 100% { opacity: 0; }
                  12% { opacity: 0.9; }
                  18% { opacity: 0; }
                  35% { opacity: 0; }
                  40% { opacity: 0.8; }
                  46% { opacity: 0; }
                  72% { opacity: 1; }
                  80% { opacity: 0; }
                }
                @keyframes sparkParticle {
                  0% { opacity: 0; transform: translate(0, 0) scale(0.3); }
                  40% { opacity: 1; }
                  100% { opacity: 0; transform: translate(var(--tx, 10px), var(--ty, -14px)) scale(1.2); }
                }
                @keyframes plugSurgeGlow {
                  0%, 100% { filter: drop-shadow(0 0 2px rgba(255, 210, 63, 0.25)); }
                  50% { filter: drop-shadow(0 0 10px rgba(255, 210, 63, 0.85)) drop-shadow(0 0 18px rgba(36, 59, 155, 0.45)); }
                }
                .current-flow-left {
                  animation: pulseCurrentLeft 1.2s linear infinite;
                }
                .current-flow-right {
                  animation: pulseCurrentRight 1.2s linear infinite;
                }
                .zap-primary {
                  transform-origin: 200px 65px;
                  animation: electricZapPrimary 1.4s ease-in-out infinite;
                }
                .zap-secondary {
                  animation: electricZapSecondary 1.8s ease-in-out infinite;
                }
                .spark-pop-1 {
                  --tx: 8px; --ty: -16px;
                  animation: sparkParticle 0.9s ease-out infinite 0.2s;
                }
                .spark-pop-2 {
                  --tx: -10px; --ty: 14px;
                  animation: sparkParticle 1.1s ease-out infinite 0.5s;
                }
                .spark-pop-3 {
                  --tx: 12px; --ty: 12px;
                  animation: sparkParticle 0.8s ease-out infinite 0.7s;
                }
                .plug-glow {
                  animation: plugSurgeGlow 1.4s ease-in-out infinite;
                }
              `}</style>

              {/* Left Base Cable (Biru Malam #121F55) */}
              <path
                d="M 15 36 Q 75 92, 148 64"
                stroke="#121F55"
                strokeWidth="6"
                strokeLinecap="round"
                className="dark:stroke-[#243B9B]"
              />
              {/* Left Electric Current Flow Overlay (Kuning Tiket #FFD23F) */}
              <path
                d="M 15 36 Q 75 92, 148 64"
                stroke="#FFD23F"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="14 26"
                className="current-flow-left"
                filter="url(#wire-glow)"
              />

              {/* Left Plug: Female Socket Body (Biru Almamater #243B9B) */}
              <g className="plug-glow">
                <rect
                  x="148"
                  y="52"
                  width="28"
                  height="24"
                  rx="6"
                  fill="#243B9B"
                  stroke="#121F55"
                  strokeWidth="1.5"
                />
                {/* Socket Collar (#FFD23F Accent Line) */}
                <rect x="172" y="55" width="4" height="18" rx="2" fill="#FFD23F" />
                {/* Socket Receptacle Holes */}
                <rect x="174" y="58" width="2.5" height="3.5" rx="0.8" fill="#14172B" />
                <rect x="174" y="66" width="2.5" height="3.5" rx="0.8" fill="#14172B" />
              </g>

              {/* ELECTRIC LIGHTNING / SPARKS BETWEEN PLUGS (#FFD23F & #FFFFFF) */}
              <g className="zap-primary" filter="url(#electric-glow)">
                {/* Main crackling electric arc */}
                <path
                  d="M 176 60 L 186 51 L 191 66 L 199 53 L 206 67 L 214 60"
                  stroke="#FFD23F"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M 176 60 L 186 51 L 191 66 L 199 53 L 206 67 L 214 60"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>

              {/* Secondary branching electric zap */}
              <g className="zap-secondary" filter="url(#electric-glow)">
                <path
                  d="M 186 51 L 190 42 L 197 49 L 204 43 L 210 52"
                  stroke="#FFD23F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M 183 67 L 190 75 L 198 68 L 205 76"
                  stroke="#FFD23F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>

              {/* Spark particles jumping in air */}
              <circle cx="192" cy="46" r="2" fill="#FFD23F" className="spark-pop-1" filter="url(#electric-glow)" />
              <circle cx="202" cy="70" r="1.8" fill="#FFFFFF" className="spark-pop-2" filter="url(#electric-glow)" />
              <circle cx="197" cy="62" r="2.2" fill="#FFD23F" className="spark-pop-3" filter="url(#electric-glow)" />

              {/* Right Plug Prongs (Metallic #E1E4EE + #FFD23F electric tip) */}
              <g className="plug-glow">
                <rect x="214" y="58" width="11" height="3.5" rx="1" fill="#E1E4EE" stroke="#5B6078" strokeWidth="0.5" />
                <rect x="214" y="66" width="11" height="3.5" rx="1" fill="#E1E4EE" stroke="#5B6078" strokeWidth="0.5" />
                <circle cx="214" cy="59.7" r="1.5" fill="#FFD23F" />
                <circle cx="214" cy="67.7" r="1.5" fill="#FFD23F" />

                {/* Right Plug: Male Body (Biru Almamater #243B9B) */}
                <rect
                  x="225"
                  y="52"
                  width="28"
                  height="24"
                  rx="6"
                  fill="#243B9B"
                  stroke="#121F55"
                  strokeWidth="1.5"
                />
                {/* Collar Accent (#FFD23F) */}
                <rect x="223" y="55" width="3" height="18" rx="1.5" fill="#FFD23F" />
              </g>

              {/* Right Base Cable (Biru Malam #121F55) */}
              <path
                d="M 253 64 Q 325 92, 425 36"
                stroke="#121F55"
                strokeWidth="6"
                strokeLinecap="round"
                className="dark:stroke-[#243B9B]"
              />
              {/* Right Electric Current Flow Overlay (Kuning Tiket #FFD23F) */}
              <path
                d="M 253 64 Q 325 92, 425 36"
                stroke="#FFD23F"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="14 26"
                className="current-flow-right"
                filter="url(#wire-glow)"
              />
            </svg>
          </div>
        </div>

        {/* Small subtitle tag (Biru Malam #121F55 surface + Kuning Tiket #FFD23F icon) */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[#121F55] text-[#E6EAFA] px-4 py-1.5 text-xs font-medium shadow-md mb-4 border border-[#243B9B]/40">
          <Zap className="h-3.5 w-3.5 text-[#FFD23F] animate-bounce" />
          <span>Koneksi arus ke halaman ini terputus!</span>
        </div>

        {/* Headline with Project Palette Typography */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#14172B] dark:text-[#F6F7FB]">
          Oops! Halaman <span className="text-[#243B9B] dark:text-[#FFD23F]">Tidak Ditemukan</span>
        </h1>

        {/* Description (Teks Sekunder #5B6078) */}
        <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-[#5B6078] dark:text-[#E6EAFA]/70 leading-relaxed">
          Halaman yang Anda tuju mungkin telah dipindahkan alamatnya, dihapus, atau sedang tidak dapat diakses untuk sementara waktu.
        </p>

        {/* CTA: Back to Dashboard Button Only (Kuning Tiket #FFD23F + Text #14172B per PALETTE.md) */}
        <div className="mt-8 flex justify-center">
          <Link
            href={dashboardUrl}
            className="group inline-flex items-center justify-center gap-2.5 h-12 px-8 rounded-xl bg-[#FFD23F] hover:bg-[#FFD23F]/90 text-[#14172B] font-bold text-sm sm:text-base shadow-md hover:shadow-[0_0_24px_rgba(255,210,63,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] tracking-wide border border-amber-300/60 cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 text-[#14172B]" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
