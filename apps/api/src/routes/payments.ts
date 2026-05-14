import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { can } from '../lib/permissions'
import { requireAuth, requireAdmin, type AuthVariables } from '../middleware/auth.middleware'
import { paymentRateLimit } from '../middleware/rate-limit.middleware'
import * as paymentService from '../services/payment.service'
import { initiateTourPaymentSchema, triggerCommissionSchema } from '@saas-immo/schemas'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'

export const paymentsRouter = new Hono<{ Variables: AuthVariables }>()

paymentsRouter.use('/*', requireAuth)

paymentsRouter.post(
    '/tour',
    paymentRateLimit,
    zValidator('json', initiateTourPaymentSchema),
    async (c) => {
        const user = c.get('user')

        try {
            const { tourOrderId } = c.req.valid('json')
            const [tourOrder] = await db
                .select()
                .from(schema.virtualTourOrders)
                .where(eq(schema.virtualTourOrders.id, tourOrderId))

            const [asset] = tourOrder
                ? await db
                      .select()
                      .from(schema.assets)
                      .where(eq(schema.assets.id, tourOrder.assetId))
                : []

            if (!can(user, 'payment:tour:create', { ownerId: asset?.ownerId })) {
                return c.json({ error: 'Forbidden' }, 403)
            }

            const result = await paymentService.initiateTourPayment(tourOrderId, user.id)
            return c.json({ data: result }, 201)
        } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            if (msg === 'TOUR_ORDER_NOT_PAYABLE') return c.json({ error: msg }, 400)
            return c.json({ error: 'Internal server error' }, 500)
        }
    }
)

paymentsRouter.post(
    '/commission',
    requireAdmin,
    zValidator('json', triggerCommissionSchema),
    async (c) => {
        try {
            const { leaseId } = c.req.valid('json')
            const result = await paymentService.triggerCommission(leaseId)
            return c.json({ data: result }, 201)
        } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            if (msg === 'COMMISSION_PAYMENT_NOT_FOUND' || msg === 'COMMISSION_ALREADY_PROCESSED') {
                return c.json({ error: msg }, 400)
            }
            return c.json({ error: 'Internal server error' }, 500)
        }
    }
)

paymentsRouter.get('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')

    try {
        const payment = await paymentService.getPaymentById(id)
        if (!payment) return c.json({ error: 'Not found' }, 404)

        if (user.role !== 'ADMIN' && payment.userId !== user.id) {
            return c.json({ error: 'Forbidden' }, 403)
        }

        return c.json({ data: payment })
    } catch (err) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})
