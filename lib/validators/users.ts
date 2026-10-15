import { z } from 'zod'

export const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: 'Nama lengkap minimal 2 karakter' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
  nim: z
    .string()
    .trim()
    .max(20, { message: 'NIM maksimal 20 karakter' })
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email({ message: 'Format email tidak valid' }),
  password: z
    .string()
    .min(8, { message: 'Password minimal 8 karakter' }),
  role: z.enum(['ADMIN', 'PANITIA', 'MAHASISWA'], {
    message: 'Role harus ADMIN, PANITIA, atau MAHASISWA',
  }),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: 'Nama lengkap minimal 2 karakter' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
  nim: z
    .string()
    .trim()
    .max(20, { message: 'NIM maksimal 20 karakter' })
    .optional()
    .or(z.literal('')),
  role: z.enum(['ADMIN', 'PANITIA', 'MAHASISWA'], {
    message: 'Role harus ADMIN, PANITIA, atau MAHASISWA',
  }),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const setUserActiveSchema = z.object({
  is_active: z.boolean({ message: 'Status aktif harus berupa boolean' }),
})

export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>
