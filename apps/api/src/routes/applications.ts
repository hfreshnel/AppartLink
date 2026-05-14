import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { can } from '../lib/permissions'
import { requireAuth, type AuthVariables } from '../middleware/auth.middleware'
import * as appService from '../services/application.service'
import {
    createApplicationSchema,
    updateApplicationSchema,
    addDocumentSchema,
} from '@saas-immo/schemas'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'

export const applicationsRouter = new Hono<{ Variables: AuthVariables }>()

applicationsRouter.use('/*', requireAuth)

applicationsRouter.post('/', zValidator('json', createApplicationSchema), async (c) => {
    const user = c.get('user')
    if (!can(user, 'application:create')) return c.json({ error: 'Forbidden' }, 403)

    try {
        const input = c.req.valid('json')
        const application = await appService.createApplication(user.id, input)
        return c.json({ data: application }, 201)
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Internal server error'
        if (msg === 'APPLICATION_ALREADY_EXISTS') return c.json({ error: msg }, 409)
        if (msg === 'ASSET_NOT_AVAILABLE') return c.json({ error: msg }, 400)
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.get('/asset/:assetId', async (c) => {
    const user = c.get('user')
    const assetId = c.req.param('assetId')

    try {
        const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, assetId))
        if (!asset) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'application:read:received', { ownerId: asset.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const applications = await appService.getApplicationsByAsset(assetId)
        return c.json({ data: applications })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.get('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const application = await appService.getApplicationById(id)
        if (!application) return c.json({ error: 'Not found' }, 404)

        const [asset] = await db
            .select()
            .from(schema.assets)
            .where(eq(schema.assets.id, application.assetId))

        const canRead =
            can(user, 'application:read:own', { tenantId: application.tenantId }) ||
            can(user, 'application:read:received', { ownerId: asset?.ownerId }) ||
            user.role === 'ADMIN'

        if (!canRead) return c.json({ error: 'Forbidden' }, 403)

        return c.json({ data: application })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.patch('/:id', zValidator('json', updateApplicationSchema), async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const application = await appService.getApplicationById(id)
        if (!application) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'application:read:own', { tenantId: application.tenantId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }
        if (application.status !== 'DRAFT') return c.json({ error: 'Cannot modify submitted application' }, 400)

        const { message } = c.req.valid('json')
        await db
            .update(schema.applications)
            .set({ message, updatedAt: new Date() })
            .where(eq(schema.applications.id, id))

        return c.json({ data: await appService.getApplicationById(id) })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.post('/:id/submit', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const application = await appService.getApplicationById(id)
        if (!application) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'application:read:own', { tenantId: application.tenantId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const updated = await appService.submitApplication(id)
        return c.json({ data: updated })
    } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'APPLICATION_NOT_FOUND_OR_NOT_DRAFT') return c.json({ error: msg }, 400)
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.post('/:id/withdraw', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const application = await appService.getApplicationById(id)
        if (!application) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'application:read:own', { tenantId: application.tenantId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        await appService.withdrawApplication(id)
        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.post('/:id/select', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const application = await appService.getApplicationById(id)
        if (!application) return c.json({ error: 'Not found' }, 404)

        const [asset] = await db
            .select()
            .from(schema.assets)
            .where(eq(schema.assets.id, application.assetId))

        if (!can(user, 'application:select', { ownerId: asset?.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const updated = await appService.selectApplication(id)
        return c.json({ data: updated })
    } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'APPLICATION_NOT_SUBMITTED') return c.json({ error: msg }, 400)
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.post('/:id/reject', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const application = await appService.getApplicationById(id)
        if (!application) return c.json({ error: 'Not found' }, 404)

        const [asset] = await db
            .select()
            .from(schema.assets)
            .where(eq(schema.assets.id, application.assetId))

        if (!can(user, 'application:select', { ownerId: asset?.ownerId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        await appService.rejectApplication(id)
        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.post('/:id/documents', zValidator('json', addDocumentSchema), async (c) => {
    const user = c.get('user')
    const applicationId = c.req.param('id')

    try {
        const application = await appService.getApplicationById(applicationId)
        if (!application) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'document:upload', { tenantId: application.tenantId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const input = c.req.valid('json')
        const docId = await appService.addDocument(applicationId, input)
        return c.json({ data: { id: docId } }, 201)
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

applicationsRouter.delete('/:id/documents/:docId', async (c) => {
    const user = c.get('user')
    const applicationId = c.req.param('id')

    try {
        const application = await appService.getApplicationById(applicationId)
        if (!application) return c.json({ error: 'Not found' }, 404)
        if (!can(user, 'document:upload', { tenantId: application.tenantId })) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        await appService.deleteDocument(c.req.param('docId'))
        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
