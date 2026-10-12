import { z } from 'zod'

export const checkInSchema = z.object({
  ticketCode: z
    .string()
    .trim()
    .min(1, 'Kode tiket tidak boleh kosong')
    .max(50, 'Kode tiket terlalu panjang')
    .transform((val) => val.toUpperCase()),
  eventId: z
    .string()
    .uuid('ID event tidak valid'),
})

export type CheckInInput = z.infer<typeof checkInSchema>
