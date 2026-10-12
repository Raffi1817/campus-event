import { z } from 'zod'

export const registerEventSchema = z.object({
  eventId: z.string().uuid({ message: 'ID event tidak valid' }),
})

export const cancelRegistrationSchema = z.object({
  registrationId: z.string().uuid({ message: 'ID pendaftaran tidak valid' }),
})

export type RegisterEventInput = z.infer<typeof registerEventSchema>
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>
