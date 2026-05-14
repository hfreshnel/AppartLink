import { db, schema } from '@saas-immo/db'
import { eq, and, ne } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import type { CreateApplicationInput, UpdateApplicationInput, AddDocumentInput } from '@saas-immo/schemas'
import { emailQueue } from '../workers/queues'

export async function createApplication(tenantId: string, input: CreateApplicationInput) {
    const [existing] = await db
        .select({ id: schema.applications.id })
        .from(schema.applications)
        .where(
            and(
                eq(schema.applications.assetId, input.assetId),
                eq(schema.applications.tenantId, tenantId)
            )
        )

    if (existing) throw new Error('APPLICATION_ALREADY_EXISTS')

    const [asset] = await db
        .select({ status: schema.assets.status })
        .from(schema.assets)
        .where(eq(schema.assets.id, input.assetId))

    if (!asset || asset.status !== 'PUBLISHED') throw new Error('ASSET_NOT_AVAILABLE')

    const id = createId()

    await db.insert(schema.applications).values({
        id,
        assetId: input.assetId,
        tenantId,
        message: input.message,
        status: 'DRAFT',
    })

    return getApplicationById(id)
}

export async function getApplicationById(id: string) {
    const [application] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, id))

    if (!application) return null

    const documents = await db
        .select()
        .from(schema.applicationDocuments)
        .where(eq(schema.applicationDocuments.applicationId, id))

    return { ...application, documents }
}

export async function getApplicationsByAsset(assetId: string) {
    return db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.assetId, assetId))
}

export async function submitApplication(id: string) {
    const [app] = await db
        .select()
        .from(schema.applications)
        .where(and(eq(schema.applications.id, id), eq(schema.applications.status, 'DRAFT')))

    if (!app) throw new Error('APPLICATION_NOT_FOUND_OR_NOT_DRAFT')

    await db
        .update(schema.applications)
        .set({ status: 'SUBMITTED', updatedAt: new Date() })
        .where(eq(schema.applications.id, id))

    await emailQueue.add('application-submitted', { applicationId: id })

    return getApplicationById(id)
}

export async function withdrawApplication(id: string) {
    await db
        .update(schema.applications)
        .set({ status: 'WITHDRAWN', updatedAt: new Date() })
        .where(eq(schema.applications.id, id))
}

export async function selectApplication(id: string) {
    const [app] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, id))

    if (!app || app.status !== 'SUBMITTED') throw new Error('APPLICATION_NOT_SUBMITTED')

    await db
        .update(schema.applications)
        .set({ status: 'SELECTED', updatedAt: new Date() })
        .where(eq(schema.applications.id, id))

    // Reject all other submitted applications for the same asset
    await db
        .update(schema.applications)
        .set({ status: 'REJECTED', updatedAt: new Date() })
        .where(
            and(
                eq(schema.applications.assetId, app.assetId),
                eq(schema.applications.status, 'SUBMITTED'),
                ne(schema.applications.id, id)
            )
        )

    await emailQueue.add('application-selected', { applicationId: id })

    return getApplicationById(id)
}

export async function rejectApplication(id: string) {
    await db
        .update(schema.applications)
        .set({ status: 'REJECTED', updatedAt: new Date() })
        .where(eq(schema.applications.id, id))

    await emailQueue.add('application-rejected', { applicationId: id })
}

export async function addDocument(applicationId: string, input: AddDocumentInput) {
    const id = createId()

    await db.insert(schema.applicationDocuments).values({
        id,
        applicationId,
        type: input.type,
        r2KeyQuarantine: input.r2KeyQuarantine,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        status: 'PENDING',
    })

    return id
}

export async function deleteDocument(docId: string) {
    const [doc] = await db
        .select()
        .from(schema.applicationDocuments)
        .where(eq(schema.applicationDocuments.id, docId))

    if (!doc) return null

    await db
        .delete(schema.applicationDocuments)
        .where(eq(schema.applicationDocuments.id, docId))

    return doc
}
