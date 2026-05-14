import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { can } from '../lib/permissions'
import { requireAuth, requireAdmin, type AuthVariables } from '../middleware/auth.middleware'
import * as leaseService from '../services/lease.service'
import { createLeaseSchema } from '@saas-immo/schemas'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'

export const leasesRouter = new Hono<{ Variables: AuthVariables }>()

leasesRouter.use('/*', requireAuth)

leasesRouter.get('/mine', async (c) => {
    const user = c.get('user')
    try {
        const role = user.role === 'OWNER' ? 'OWNER' : 'TENANT'
        const leases = await leaseService.getLeasesByUser(user.id, role)
        return c.json({ data: leases })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

leasesRouter.post('/', zValidator('json', createLeaseSchema), async (c) => {
    const user = c.get('user')

    try {
        const input = c.req.valid('json')
        const [application] = await db
            .select()
            .from(schema.applications)
            .where(eq(schema.applications.id, input.applicationId))

        const [asset] = application
            ? await db
                  .select()
                  .from(schema.assets)
                  .where(eq(schema.assets.id, application.assetId))
            : []

        if (!can(user, 'lease:create', { ownerId: asset?.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const lease = await leaseService.createLease(input)
        return c.json({ data: lease }, 201)
    } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'APPLICATION_NOT_SELECTED') return c.json({ error: msg }, 400)
        return c.json({ error: 'Internal server error' }, 500)
    }
})

leasesRouter.get('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const lease = await leaseService.getLeaseById(id)
        if (!lease) return c.json({ error: 'Not found' }, 404)

        const [asset] = await db
            .select()
            .from(schema.assets)
            .where(eq(schema.assets.id, lease.assetId))

        const [application] = await db
            .select()
            .from(schema.applications)
            .where(eq(schema.applications.id, lease.applicationId))

        const canRead =
            can(user, 'lease:read:own', { userId: asset?.ownerId }) ||
            can(user, 'lease:read:own', { userId: application?.tenantId }) ||
            user.role === 'ADMIN'

        if (!canRead) return c.json({ error: 'Forbidden' }, 403)

        return c.json({ data: lease })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

leasesRouter.patch('/:id/sign', requireAdmin, async (c) => {
    try {
        await leaseService.signLease(c.req.param('id'))
        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

leasesRouter.patch('/:id/archive', requireAdmin, async (c) => {
    try {
        const id = c.req.param('id')
        await db
            .update(schema.leases)
            .set({ status: 'ARCHIVED', archivedAt: new Date(), updatedAt: new Date() })
            .where(eq(schema.leases.id, id))

        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
