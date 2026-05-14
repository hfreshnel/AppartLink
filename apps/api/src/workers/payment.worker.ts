import { Worker, type Job } from 'bullmq'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { redis } from '../lib/redis'
import { emailQueue } from './queues'

type PaymentJobPayload = {
    fedaPayTransactionId: string
    paymentId?: string
    tourOrderId?: string
    leaseId?: string
}

async function isAlreadyProcessed(fedaPayTransactionId: string): Promise<boolean> {
    const [existing] = await db
        .select({ status: schema.payments.status })
        .from(schema.payments)
        .where(eq(schema.payments.fedaPayTransactionId, fedaPayTransactionId))

    return existing?.status === 'SUCCEEDED'
}

async function processTourSucceeded(job: Job<PaymentJobPayload>): Promise<void> {
    const { fedaPayTransactionId, tourOrderId, paymentId } = job.data

    if (await isAlreadyProcessed(fedaPayTransactionId)) return

    if (paymentId) {
        await db
            .update(schema.payments)
            .set({ status: 'SUCCEEDED', fedaPayTransactionId, updatedAt: new Date() })
            .where(eq(schema.payments.id, paymentId))
    }

    if (tourOrderId) {
        await db
            .update(schema.virtualTourOrders)
            .set({ status: 'PAID', updatedAt: new Date() })
            .where(eq(schema.virtualTourOrders.id, tourOrderId))

        await db
            .update(schema.assets)
            .set({ status: 'TOUR_PENDING', updatedAt: new Date() })
            .where(
                eq(
                    schema.assets.id,
                    db
                        .select({ assetId: schema.virtualTourOrders.assetId })
                        .from(schema.virtualTourOrders)
                        .where(eq(schema.virtualTourOrders.id, tourOrderId))
                        .limit(1) as unknown as string
                )
            )
    }

    if (paymentId) {
        await emailQueue.add('payment-succeeded', { paymentId })
    }
}

async function processCommissionSucceeded(job: Job<PaymentJobPayload>): Promise<void> {
    const { fedaPayTransactionId, paymentId } = job.data

    if (await isAlreadyProcessed(fedaPayTransactionId)) return

    if (paymentId) {
        await db
            .update(schema.payments)
            .set({ status: 'SUCCEEDED', fedaPayTransactionId, updatedAt: new Date() })
            .where(eq(schema.payments.id, paymentId))

        await emailQueue.add('payment-succeeded', { paymentId })
    }
}

async function processPaymentFailed(job: Job<PaymentJobPayload>): Promise<void> {
    const { paymentId } = job.data
    if (!paymentId) return

    await db
        .update(schema.payments)
        .set({ status: 'FAILED', updatedAt: new Date() })
        .where(eq(schema.payments.id, paymentId))
}

async function processPaymentRefunded(job: Job<PaymentJobPayload>): Promise<void> {
    const { paymentId } = job.data
    if (!paymentId) return

    await db
        .update(schema.payments)
        .set({ status: 'REFUNDED', updatedAt: new Date() })
        .where(eq(schema.payments.id, paymentId))
}

async function processPayment(job: Job<PaymentJobPayload>): Promise<void> {
    switch (job.name) {
        case 'payment-tour-succeeded':
            return processTourSucceeded(job)
        case 'payment-commission-succeeded':
            return processCommissionSucceeded(job)
        case 'payment-failed':
            return processPaymentFailed(job)
        case 'payment-refunded':
            return processPaymentRefunded(job)
        default:
            console.warn(`[payment-worker] Unknown job: ${job.name}`)
    }
}

export const paymentWorker = new Worker('payment-queue', processPayment, {
    connection: redis,
    concurrency: 3,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
    },
})

paymentWorker.on('failed', (job, err) => {
    console.error(`[payment-worker] Job ${job?.id} failed:`, err.message)
})
