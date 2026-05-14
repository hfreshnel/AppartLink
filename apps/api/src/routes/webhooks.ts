import { Hono } from 'hono'
import { verifyFedaPaySignature } from '../lib/hmac'
import { paymentQueue } from '../workers/queues'

export const webhooksRouter = new Hono()

webhooksRouter.post('/fedapay', async (c) => {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-fedapay-signature') ?? null

    if (!verifyFedaPaySignature(rawBody, signature)) {
        return c.json({ error: 'Invalid signature' }, 401)
    }

    let event: { id: string; type: string; data: { id: string; amount: number; custom_metadata?: Record<string, string> } }

    try {
        event = JSON.parse(rawBody)
    } catch {
        return c.json({ error: 'Invalid JSON' }, 400)
    }

    const metadata = event.data.custom_metadata ?? {}
    const eventType = event.type
    const fedaPayTransactionId = String(event.data.id)

    try {
        if (eventType === 'transaction.approved' && metadata['type'] === 'TOUR_FEE') {
            await paymentQueue.add('payment-tour-succeeded', {
                fedaPayTransactionId,
                tourOrderId: metadata['tourOrderId'],
                paymentId: metadata['paymentId'],
            })
        } else if (eventType === 'transaction.approved' && metadata['type'] === 'COMMISSION') {
            await paymentQueue.add('payment-commission-succeeded', {
                fedaPayTransactionId,
                leaseId: metadata['leaseId'],
                paymentId: metadata['paymentId'],
            })
        } else if (eventType === 'transaction.declined' || eventType === 'transaction.canceled') {
            await paymentQueue.add('payment-failed', {
                fedaPayTransactionId,
                paymentId: metadata['paymentId'],
            })
        } else if (eventType === 'transaction.refunded') {
            await paymentQueue.add('payment-refunded', {
                fedaPayTransactionId,
                paymentId: metadata['paymentId'],
            })
        }
        // transaction.created is ignored
    } catch (err) {
        console.error('[webhook/fedapay] Failed to enqueue:', err)
        // Still return 200 — enqueue failure is retried separately
    }

    return c.json({ received: true }, 200)
})
