import { z } from 'zod'

export const payRegistrationSchema = z
  .object({
    registrationId: z.string().uuid({ message: 'ID pendaftaran tidak valid' }),
    method: z.enum(['TRANSFER_BANK', 'E_WALLET', 'CASH'], {
      message: 'Pilih metode pembayaran yang valid (Transfer Bank, E-Wallet, atau Cash)',
    }),
    proofUrl: z.string().url({ message: 'URL bukti pembayaran tidak valid' }).optional().nullable(),
  })
  .refine(
    (data) => {
      if ((data.method === 'TRANSFER_BANK' || data.method === 'E_WALLET') && !data.proofUrl) {
        return false
      }
      return true
    },
    {
      message: 'Bukti pembayaran wajib diunggah untuk Transfer Bank dan E-Wallet',
      path: ['proofUrl'],
    }
  )

export const confirmPaymentSchema = z.object({
  registrationId: z.string().uuid({ message: 'ID pendaftaran tidak valid' }),
  approve: z.boolean(),
})

export type PayRegistrationInput = z.infer<typeof payRegistrationSchema>
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>

