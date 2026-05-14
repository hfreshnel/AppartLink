import { z } from 'zod'

export const createApplicationSchema = z.object({
    assetId: z.string().cuid(),
    message: z.string().max(1000).optional(),
})

export const updateApplicationSchema = z.object({
    message: z.string().max(1000).optional(),
})

export const addDocumentSchema = z.object({
    type: z.enum([
        'ID_CARD',
        'PROOF_OF_INCOME',
        'EMPLOYMENT_CONTRACT',
        'BANK_STATEMENT',
        'TAX_NOTICE',
        'OTHER',
    ]),
    r2KeyQuarantine: z.string().min(1),
    mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    sizeBytes: z
        .number()
        .int()
        .positive()
        .max(10 * 1024 * 1024),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type AddDocumentInput = z.infer<typeof addDocumentSchema>
