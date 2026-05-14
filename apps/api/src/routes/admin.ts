import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAdmin, type AuthVariables } from '../middleware/auth.middleware'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import * as settingsService from '../services/settings.service'
import { updateSettingsSchema } from '@saas-immo/schemas'
import { SETTING_KEYS } from '@saas-immo/db'

export const adminRouter = new Hono<{ Variables: AuthVariables }>()

adminRouter.use('/*', requireAdmin)

adminRouter.get('/users', async (c) => {
    try {
        const users = await db.select().from(schema.users)
        return c.json({ data: users })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

const updateRoleSchema = z.object({
    role: z.enum(['TENANT', 'OWNER', 'ADMIN']),
})

adminRouter.patch('/users/:id/role', zValidator('json', updateRoleSchema), async (c) => {
    try {
        const { role } = c.req.valid('json')
        await db
            .update(schema.users)
            .set({ role, updatedAt: new Date() })
            .where(eq(schema.users.id, c.req.param('id')))

        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

adminRouter.get('/stats', async (c) => {
    try {
        const [users, assets, applications, leases, payments] = await Promise.all([
            db.select({ id: schema.users.id }).from(schema.users),
            db.select({ id: schema.assets.id }).from(schema.assets),
            db.select({ id: schema.applications.id }).from(schema.applications),
            db.select({ id: schema.leases.id }).from(schema.leases),
            db.select({ id: schema.payments.id }).from(schema.payments),
        ])

        return c.json({
            data: {
                totalUsers: users.length,
                totalAssets: assets.length,
                totalApplications: applications.length,
                totalLeases: leases.length,
                totalPayments: payments.length,
            },
        })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

adminRouter.get('/settings', async (c) => {
    try {
        const settings = await settingsService.getAllSettings()
        return c.json({ data: settings })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

adminRouter.patch('/settings', zValidator('json', updateSettingsSchema), async (c) => {
    try {
        const input = c.req.valid('json')

        if (input.appName !== undefined) {
            await settingsService.updateSetting(SETTING_KEYS.APP_NAME, input.appName)
        }

        return c.json({ data: null })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
