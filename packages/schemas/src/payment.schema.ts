import { z } from 'zod'

export const initiateTourPaymentSchema = z.object({
    tourOrderId: z.string().cuid(),
})

export const triggerCommissionSchema = z.object({
    leaseId: z.string().cuid(),
})

export type InitiateTourPaymentInput = z.infer<typeof initiateTourPaymentSchema>
export type TriggerCommissionInput = z.infer<typeof triggerCommissionSchema>
