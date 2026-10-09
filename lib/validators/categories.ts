import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Nama kategori minimal 2 karakter' })
    .max(50, { message: 'Nama kategori maksimal 50 karakter' }),
  description: z
    .string()
    .trim()
    .max(255, { message: 'Deskripsi kategori maksimal 255 karakter' })
    .optional()
    .or(z.literal('')),
})

export type CategoryInput = z.infer<typeof categorySchema>
