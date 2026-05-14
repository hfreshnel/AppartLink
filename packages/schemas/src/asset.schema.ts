import { z } from 'zod'

export const createAssetSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(['PROPERTY', 'VEHICLE']).default('PROPERTY'),
    propertyDetails: z
        .object({
            surface: z.number().int().positive().optional(),
            rooms: z.number().int().positive().optional(),
            bedrooms: z.number().int().positive().optional(),
            bathrooms: z.number().int().positive().optional(),
            floor: z.number().int().min(0).optional(),
            totalFloors: z.number().int().positive().optional(),
            furnished: z.boolean().default(false),
            parking: z.boolean().default(false),
            address: z.string().min(5).max(300),
            city: z.string().min(2).max(100),
            district: z.string().max(100).optional(),
            rentAmount: z.number().int().positive(),
            charges: z.number().int().min(0).default(0),
            depositMonths: z.number().int().min(1).max(6).default(2),
        })
        .optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

export const assetFiltersSchema = z.object({
    city: z.string().optional(),
    district: z.string().optional(),
    minRent: z.coerce.number().int().positive().optional(),
    maxRent: z.coerce.number().int().positive().optional(),
    rooms: z.coerce.number().int().positive().optional(),
    furnished: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type AssetFilters = z.infer<typeof assetFiltersSchema>
