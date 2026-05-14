import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth, type AuthVariables } from '../middleware/auth.middleware'
import * as uploadService from '../services/upload.service'

export const uploadsRouter = new Hono<{ Variables: AuthVariables }>()

uploadsRouter.use('/*', requireAuth)

const presignSchema = z.object({
    mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    sizeBytes: z
        .number()
        .int()
        .positive()
        .max(10 * 1024 * 1024),
})

uploadsRouter.post('/presign', zValidator('json', presignSchema), async (c) => {
    const user = c.get('user')

    try {
        const { mimeType, sizeBytes } = c.req.valid('json')
        const result = await uploadService.generatePresignedUploadUrl({
            mimeType,
            sizeBytes,
            userId: user.id,
        })
        return c.json({ data: result })
    } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'MIME_TYPE_NOT_ALLOWED' || msg === 'FILE_TOO_LARGE') {
            return c.json({ error: msg }, 400)
        }
        return c.json({ error: 'Internal server error' }, 500)
    }
})

const confirmSchema = z.object({
    documentId: z.string().cuid(),
    r2KeyQuarantine: z.string().min(1),
    mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    sizeBytes: z
        .number()
        .int()
        .positive()
        .max(10 * 1024 * 1024),
})

uploadsRouter.post('/confirm', zValidator('json', confirmSchema), async (c) => {
    try {
        const input = c.req.valid('json')
        await uploadService.confirmUpload(input)
        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
