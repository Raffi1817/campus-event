'use client'

import React from 'react'
import {
  Ticket,
  GraduationCap,
  Calendar,
  QrCode,
  Trophy,
  Megaphone,
} from 'lucide-react'

export function HeroParticles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <style>{`
        @keyframes floatCampus1 {
          0%, 100% {
            transform: translateY(0px) rotate(-6deg);
          }
          50% {
            transform: translateY(-16px) rotate(4deg);
          }
        }
        @keyframes floatCampus2 {
          0%, 100% {
            transform: translateY(0px) rotate(6deg) scale(1);
          }
          50% {
            transform: translateY(-20px) rotate(-5deg) scale(1.04);
          }
        }
        @keyframes floatCampus3 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(-8deg);
          }
        }
        .anim-campus-1 {
          animation: floatCampus1 6.8s ease-in-out infinite;
        }
        .anim-campus-2 {
          animation: floatCampus2 7.6s ease-in-out 0.8s infinite;
        }
        .anim-campus-3 {
          animation: floatCampus3 8.2s ease-in-out 1.5s infinite;
        }
        .anim-campus-4 {
          animation: floatCampus1 7.2s ease-in-out 2s infinite;
        }
        .anim-campus-5 {
          animation: floatCampus2 8.4s ease-in-out 1.2s infinite;
        }
        .anim-campus-6 {
          animation: floatCampus3 7.8s ease-in-out 0.4s infinite;
        }
      `}</style>

      {/* Soft Ambient Glow di atas (tanpa pola dot apapun) */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[46rem] rounded-full bg-gradient-to-b from-primary/10 via-primary-soft/15 to-transparent blur-3xl pointer-events-none" />

      {/* KLUSTER KANAN: Identitas Tiket & Kemahasiswaan */}

      {/* 1. E-Tiket Digital (Kuning Tiket #FFD23F) */}
      <div className="absolute top-[14%] right-[6%] sm:right-[10%] md:right-[14%]">
        <div className="anim-campus-1 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#FFD23F] text-[#14172B] shadow-[0_8px_20px_rgba(255,210,63,0.45)] border border-amber-300/60 transition-transform">
          <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {/* 2. Topi Toga Akademik (Biru Almamater #243B9B) */}
      <div className="absolute top-[48%] right-[8%] sm:right-[12%] md:right-[16%]">
        <div className="anim-campus-2 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(36,59,155,0.35)] border border-primary/40 transition-transform">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {/* 3. QR Code Verifikasi Check-in (Hijau Sukses #0E8A6F) */}
      <div className="absolute top-[76%] right-[5%] sm:right-[9%] md:right-[13%]">
        <div className="anim-campus-3 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#DDF5EE] text-[#0E8A6F] shadow-[0_8px_20px_rgba(14,138,111,0.25)] border border-[#0E8A6F]/25 dark:bg-[#0E8A6F]/20 dark:text-[#DDF5EE] transition-transform">
          <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {/* KLUSTER KIRI: Identitas Agenda & Prestasi Kampus */}

      {/* 4. Kalender Agenda Kegiatan (Card Bersih dengan Aksen Biru) */}
      <div className="absolute top-[18%] left-[6%] sm:left-[10%] md:left-[14%]">
        <div className="anim-campus-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-card text-primary shadow-[0_8px_20px_rgba(36,59,155,0.18)] border border-border transition-transform">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {/* 5. Piala / Lomba & Kompetisi Mahasiswa (Gold/Amber Soft) */}
      <div className="absolute top-[50%] left-[8%] sm:left-[12%] md:left-[16%]">
        <div className="anim-campus-5 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#FFEBD1] text-[#E07A00] shadow-[0_8px_20px_rgba(224,122,0,0.25)] border border-[#E07A00]/25 dark:bg-[#E07A00]/20 dark:text-[#FFEBD1] transition-transform">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      {/* 6. Pengumuman / Suara Kampus (Info Blue Soft) */}
      <div className="absolute top-[78%] left-[5%] sm:left-[9%] md:left-[13%]">
        <div className="anim-campus-6 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#DFF0FB] text-[#1F86C7] shadow-[0_8px_20px_rgba(31,134,199,0.25)] border border-[#1F86C7]/25 dark:bg-[#1F86C7]/20 dark:text-[#DFF0FB] transition-transform">
          <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  )
}
