import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { can } from '../lib/permissions'
import { requireAuth, type AuthVariables } from '../middleware/auth.middleware'
import { publicListingRateLimit } from '../middleware/rate-limit.middleware'
import * as assetService from '../services/asset.service'
import { createAssetSchema, updateAssetSchema, assetFiltersSchema } from '@saas-immo/schemas'
import { z } from 'zod'

export const assetsRouter = new Hono<{ Variables: AuthVariables }>()

assetsRouter.get('/', publicListingRateLimit, zValidator('query', assetFiltersSchema), async (c) => {
    try {
        const filters = c.req.valid('query')
        const assets = await assetService.getPublishedAssets(filters)
        return c.json({ data: assets })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

assetsRouter.get('/mine', requireAuth, async (c) => {
    const user = c.get('user')
    if (!can(user, 'asset:read:own', { ownerId: user.id })) {
        return c.json({ error: 'Forbidden' }, 403)
    }
    try {
        const assets = await assetService.getAssetsByOwner(user.id)
        return c.json({ data: assets })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

assetsRouter.get('/:id', async (c) => {
    try {
        const asset = await assetService.getAssetById(c.req.param('id'))
        if (!asset) return c.json({ error: 'Not found' }, 404)

        if (asset.status !== 'PUBLISHED') {
            return c.json({ error: 'Not found' }, 404)
        }

        return c.json({ data: asset })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

assetsRouter.post('/', requireAuth, zValidator('json', createAssetSchema), async (c) => {
    const user = c.get('user')
    if (!can(user, 'asset:create')) return c.json({ error: 'Forbidden' }, 403)

    try {
        const input = c.req.valid('json')
        const asset = await assetService.createAsset(user.id, input)
        return c.json({ data: asset }, 201)
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

assetsRouter.patch('/:id', requireAuth, zValidator('json', updateAssetSchema), async (c) => {
    const user = c.get('user')
    const assetId = c.req.param('id')

    try {
        const existing = await assetService.getAssetById(assetId)
        if (!existing) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'asset:update', { ownerId: existing.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const input = c.req.valid('json')
        const updated = await assetService.updateAsset(assetId, input)
        return c.json({ data: updated })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

assetsRouter.delete('/:id', requireAuth, async (c) => {
    const user = c.get('user')
    const assetId = c.req.param('id')

    try {
        const existing = await assetService.getAssetById(assetId)
        if (!existing) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'asset:delete', { ownerId: existing.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        await assetService.archiveAsset(assetId)
        return c.json({ data: null }, 200)
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

const addMediaSchema = z.object({
    media: z.array(z.object({ r2Key: z.string(), mimeType: z.string(), order: z.number().int().min(0) })),
})

assetsRouter.post('/:id/media', requireAuth, zValidator('json', addMediaSchema), async (c) => {
    const user = c.get('user')
    const assetId = c.req.param('id')

    try {
        const existing = await assetService.getAssetById(assetId)
        if (!existing) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'asset:update', { ownerId: existing.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const { media } = c.req.valid('json')
        await assetService.addAssetMedia(assetId, media)
        return c.json({ data: null }, 201)
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

assetsRouter.delete('/:id/media/:mediaId', requireAuth, async (c) => {
    const user = c.get('user')
    const assetId = c.req.param('id')

    try {
        const existing = await assetService.getAssetById(assetId)
        if (!existing) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'asset:update', { ownerId: existing.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        await assetService.deleteAssetMedia(c.req.param('mediaId'))
        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
