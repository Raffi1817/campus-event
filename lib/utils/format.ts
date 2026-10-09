/**
 * Utilitas pemformatan mata uang Rupiah dan tanggal/waktu sesuai spesifikasi proyek (WIB).
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '-'
  // timeString biasanya berbentuk 'HH:mm:ss' atau 'HH:mm'
  return timeString.slice(0, 5) + ' WIB'
}
