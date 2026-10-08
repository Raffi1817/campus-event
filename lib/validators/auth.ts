import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  nim: z
    .string()
    .max(20, 'NIM maksimal 20 karakter')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export type RegisterInput = z.infer<typeof registerSchema>
