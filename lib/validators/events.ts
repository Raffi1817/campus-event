import { z } from 'zod'

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { message: 'Judul event minimal 3 karakter' })
      .max(150, { message: 'Judul event maksimal 150 karakter' }),
    category_id: z
      .string()
      .uuid({ message: 'Pilih kategori yang valid' }),
    description: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' }),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Format waktu mulai tidak valid (HH:mm)' }),
    end_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Format waktu selesai tidak valid (HH:mm)' })
      .optional()
      .or(z.literal('')),
    location: z
      .string()
      .trim()
      .min(2, { message: 'Lokasi minimal 2 karakter' })
      .max(200, { message: 'Lokasi maksimal 200 karakter' }),
    quota: z.coerce
      .number({ message: 'Kuota harus berupa angka' })
      .int({ message: 'Kuota harus bilangan bulat' })
      .positive({ message: 'Kuota harus lebih besar dari 0' }),
    price: z.coerce
      .number({ message: 'Harga harus berupa angka' })
      .int({ message: 'Harga harus bilangan bulat' })
      .min(0, { message: 'Harga tidak boleh negatif (0 untuk gratis)' }),
    poster_url: z
      .string()
      .trim()
      .url({ message: 'URL poster harus berupa alamat URL valid' })
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.end_time && data.start_time) {
        return data.end_time > data.start_time
      }
      return true
    },
    {
      message: 'Waktu selesai harus setelah waktu mulai',
      path: ['end_time'],
    }
  )

export type EventFormInput = z.infer<typeof eventFormSchema>

export const eventStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
])

export type EventStatus = z.infer<typeof eventStatusSchema>
