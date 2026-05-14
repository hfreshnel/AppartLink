import { z } from 'zod'

export const createLeaseSchema = z.object({
    applicationId: z.string().cuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    rentAmount: z.number().int().positive(),
    chargesAmount: z.number().int().min(0).default(0),
    depositAmount: z.number().int().positive(),
    terms: z.string().max(5000).optional(),
})

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>
