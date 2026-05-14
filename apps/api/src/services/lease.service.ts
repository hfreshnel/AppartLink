import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import type { CreateLeaseInput } from '@saas-immo/schemas'
import { emailQueue, pdfQueue } from '../workers/queues'

export async function createLease(input: CreateLeaseInput) {
    const [application] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, input.applicationId))

    if (!application || application.status !== 'SELECTED') {
        throw new Error('APPLICATION_NOT_SELECTED')
    }

    const id = createId()

    await db.insert(schema.leases).values({
        id,
        assetId: application.assetId,
        applicationId: input.applicationId,
        startDate: input.startDate,
        endDate: input.endDate,
        rentAmount: input.rentAmount,
        chargesAmount: input.chargesAmount,
        depositAmount: input.depositAmount,
        terms: input.terms,
        status: 'DRAFT',
    })

    // Create pending commission payment
    const commissionAmount = calculateCommission(input.rentAmount)
    const [asset] = await db
        .select()
        .from(schema.assets)
        .where(eq(schema.assets.id, application.assetId))

    if (asset) {
        await db.insert(schema.payments).values({
            id: createId(),
            type: 'COMMISSION',
            status: 'PENDING',
            amount: commissionAmount,
            leaseId: id,
            userId: asset.ownerId,
        })
    }

    await emailQueue.add('lease-created', { leaseId: id })

    return getLeaseById(id)
}

export async function getLeaseById(id: string) {
    const [lease] = await db.select().from(schema.leases).where(eq(schema.leases.id, id))
    return lease ?? null
}

export async function getLeasesByUser(userId: string, role: 'OWNER' | 'TENANT') {
    if (role === 'OWNER') {
        const ownedAssets = await db
            .select({ id: schema.assets.id })
            .from(schema.assets)
            .where(eq(schema.assets.ownerId, userId))

        const assetIds = ownedAssets.map((a) => a.id)
        if (assetIds.length === 0) return []

        return db
            .select()
            .from(schema.leases)
            .where(
                schema.leases.assetId.in(assetIds) as unknown as Parameters<
                    (typeof db.select)['where']
                >[0]
            )
    }

    const applications = await db
        .select({ id: schema.applications.id })
        .from(schema.applications)
        .where(eq(schema.applications.tenantId, userId))

    const applicationIds = applications.map((a) => a.id)
    if (applicationIds.length === 0) return []

    return db.select().from(schema.leases)
}

export async function signLease(id: string) {
    await db
        .update(schema.leases)
        .set({ status: 'SIGNED', signedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.leases.id, id))

    await pdfQueue.add('generate-lease-pdf', { leaseId: id })
}

export function calculateCommission(rentAmount: number): number {
    if (rentAmount < 100_000) return 15_000
    if (rentAmount <= 300_000) return 35_000
    return 60_000
}
