import type { Database } from '@/types/database'

export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Lunas',
  FAILED: 'Gagal / Ditolak',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TRANSFER_BANK: 'Transfer Bank (Simulasi)',
  E_WALLET: 'E-Wallet (Simulasi)',
  CASH: 'Tunai / Cash (Verifikasi Panitia)',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  PAID: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
  FAILED: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400',
}
