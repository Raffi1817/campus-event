import { z } from 'zod'

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: 'Nama lengkap minimal 2 karakter' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
