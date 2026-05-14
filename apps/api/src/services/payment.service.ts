import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { env } from '../lib/env'

const FEDAPAY_ENV = env.FEDAPAY_ENV
const FEDAPAY_SECRET = env.FEDAPAY_SECRET_KEY
const APP_URL = env.BETTER_AUTH_URL

async function createFedaPayTransaction(opts: {
    amount: number
    description: string
    customerName: string
    customerEmail: string
    callbackUrl: string
    customMetadata: Record<string, string>
}): Promise<{ id: string; checkoutUrl: string }> {
    const baseUrl = FEDAPAY_ENV === 'live' ? 'https://api.fedapay.com' : 'https://sandbox-api.fedapay.com'

    const response = await fetch(`${baseUrl}/v1/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${FEDAPAY_SECRET}`,
        },
        body: JSON.stringify({
            description: opts.description,
            amount: opts.amount,
            currency: { iso: 'XOF' },
            callback_url: opts.callbackUrl,
            customer: { name: opts.customerName, email: opts.customerEmail },
            custom_metadata: opts.customMetadata,
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`FedaPay API error: ${error}`)
    }

    const data = await response.json()
    return {
        id: String(data.v1_transaction?.id ?? data.id),
        checkoutUrl: data.v1_transaction?.links?.checkout_url ?? '',
    }
}

export async function initiateTourPayment(tourOrderId: string, userId: string) {
    const [tourOrder] = await db
        .select()
        .from(schema.virtualTourOrders)
        .where(eq(schema.virtualTourOrders.id, tourOrderId))

    if (!tourOrder || tourOrder.status !== 'PENDING_PAYMENT') {
        throw new Error('TOUR_ORDER_NOT_PAYABLE')
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId))
    if (!user) throw new Error('USER_NOT_FOUND')

    const paymentId = createId()
    const TOUR_FEE_AMOUNT = 25_000

    await db.insert(schema.payments).values({
        id: paymentId,
        type: 'TOUR_FEE',
        status: 'PENDING',
        amount: TOUR_FEE_AMOUNT,
        tourOrderId,
        userId,
    })

    const tx = await createFedaPayTransaction({
        amount: TOUR_FEE_AMOUNT,
        description: 'Frais de visite virtuelle 3D',
        customerName: user.name,
        customerEmail: user.email,
        callbackUrl: `${APP_URL}/payments/callback`,
        customMetadata: { type: 'TOUR_FEE', tourOrderId, paymentId },
    })

    await db
        .update(schema.payments)
        .set({ fedaPayTransactionId: tx.id, fedaPayCheckoutUrl: tx.checkoutUrl, updatedAt: new Date() })
        .where(eq(schema.payments.id, paymentId))

    return { paymentId, checkoutUrl: tx.checkoutUrl }
}

export async function triggerCommission(leaseId: string) {
    const [payment] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.leaseId, leaseId))

    if (!payment || payment.type !== 'COMMISSION') throw new Error('COMMISSION_PAYMENT_NOT_FOUND')
    if (payment.status !== 'PENDING') throw new Error('COMMISSION_ALREADY_PROCESSED')

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payment.userId))
    if (!user) throw new Error('USER_NOT_FOUND')

    const tx = await createFedaPayTransaction({
        amount: payment.amount,
        description: 'Commission de mise en location',
        customerName: user.name,
        customerEmail: user.email,
        callbackUrl: `${APP_URL}/payments/callback`,
        customMetadata: { type: 'COMMISSION', leaseId, paymentId: payment.id },
    })

    await db
        .update(schema.payments)
        .set({
            status: 'PROCESSING',
            fedaPayTransactionId: tx.id,
            fedaPayCheckoutUrl: tx.checkoutUrl,
            updatedAt: new Date(),
        })
        .where(eq(schema.payments.id, payment.id))

    return { paymentId: payment.id, checkoutUrl: tx.checkoutUrl }
}

export async function getPaymentById(id: string) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, id))
    return payment ?? null
}
