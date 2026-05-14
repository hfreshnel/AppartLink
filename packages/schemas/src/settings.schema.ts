import { z } from 'zod'

export const updateSettingsSchema = z.object({
    appName: z.string().min(2).max(60).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
