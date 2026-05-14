import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { can } from '../lib/permissions'
import { requireAuth, requireAdmin, type AuthVariables } from '../middleware/auth.middleware'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { emailQueue } from '../workers/queues'

export const toursRouter = new Hono<{ Variables: AuthVariables }>()

toursRouter.use('/*', requireAuth)

toursRouter.get('/', requireAdmin, async (c) => {
    try {
        const tours = await db.select().from(schema.virtualTourOrders)
        return c.json({ data: tours })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

const createTourSchema = z.object({ assetId: z.string().cuid() })

toursRouter.post('/', zValidator('json', createTourSchema), async (c) => {
    const user = c.get('user')

    try {
        const { assetId } = c.req.valid('json')
        const [asset] = await db
            .select()
            .from(schema.assets)
            .where(eq(schema.assets.id, assetId))

        if (!asset) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'tour:create', { ownerId: asset.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const [existing] = await db
            .select()
            .from(schema.virtualTourOrders)
            .where(eq(schema.virtualTourOrders.assetId, assetId))

        if (existing) return c.json({ error: 'Tour order already exists' }, 409)

        const id = createId()
        await db.insert(schema.virtualTourOrders).values({ id, assetId, status: 'PENDING_PAYMENT' })

        return c.json({ data: { id } }, 201)
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

toursRouter.get('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const [tour] = await db
            .select()
            .from(schema.virtualTourOrders)
            .where(eq(schema.virtualTourOrders.id, id))

        if (!tour) return c.json({ error: 'Not found' }, 404)

        const [asset] = await db
            .select()
            .from(schema.assets)
            .where(eq(schema.assets.id, tour.assetId))

        if (!can(user, 'tour:create', { ownerId: asset?.ownerId }) && user.role !== 'ADMIN') {
            return c.json({ error: 'Forbidden' }, 403)
        }

        return c.json({ data: tour })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

const updateTourSchema = z.object({
    status: z.enum(['PENDING_PAYMENT', 'PAID', 'SCHEDULED', 'SHOT', 'PUBLISHED']).optional(),
    scheduledAt: z.coerce.date().optional(),
    shotAt: z.coerce.date().optional(),
})

toursRouter.patch('/:id', requireAdmin, zValidator('json', updateTourSchema), async (c) => {
    const id = c.req.param('id')

    try {
        const input = c.req.valid('json')
        await db
            .update(schema.virtualTourOrders)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(schema.virtualTourOrders.id, id))

        if (input.status === 'SCHEDULED') {
            await emailQueue.add('tour-scheduled', { tourOrderId: id })
        } else if (input.status === 'PUBLISHED') {
            await emailQueue.add('tour-published', { tourOrderId: id })

            const [tour] = await db
                .select()
                .from(schema.virtualTourOrders)
                .where(eq(schema.virtualTourOrders.id, id))

            if (tour) {
                await db
                    .update(schema.assets)
                    .set({ status: 'PUBLISHED', updatedAt: new Date() })
                    .where(eq(schema.assets.id, tour.assetId))
            }
        }

        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

const kuulaSchema = z.object({ kuulaUrl: z.string().url() })

toursRouter.patch('/:id/kuula', requireAdmin, zValidator('json', kuulaSchema), async (c) => {
    try {
        await db
            .update(schema.virtualTourOrders)
            .set({ kuulaUrl: c.req.valid('json').kuulaUrl, updatedAt: new Date() })
            .where(eq(schema.virtualTourOrders.id, c.req.param('id')))

        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
