/**
 * Sanitasi nilai sel CSV untuk mencegah CSV Formula Injection (DDE attacks)
 * dan menangani karakter khusus seperti pemisah (titik koma), tanda kutip, dan baris baru.
 */
function sanitizeCell(val: unknown): string {
  if (val === null || val === undefined) return ''
  let str = String(val)

  // CSV Formula Injection protection: cegah eksekusi formula di Excel jika diawali karakter sensitif
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // Jika mengandung titik koma, tanda kutip, atau baris baru, bungkus dengan tanda kutip dua dan escape tanda kutip ganda
  if (/[;"\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Menghasilkan string file CSV dengan standar Excel Indonesia:
 * 1. Byte Order Mark (BOM) UTF-8 (\uFEFF) untuk deteksi karakter internasional.
 * 2. Header `sep=;\r\n` agar Excel otomatis menggunakan titik koma sebagai pemisah kolom.
 * 3. Delimiter titik koma (;) sesuai locale Indonesia / sistem desimal koma.
 */
export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const BOM = '\uFEFF'
  const sepHeader = 'sep=;\r\n'

  const headerLine = headers.map(sanitizeCell).join(';')
  const rowLines = rows.map((row) => row.map(sanitizeCell).join(';')).join('\r\n')

  return `${BOM}${sepHeader}${headerLine}\r\n${rowLines}`
}
