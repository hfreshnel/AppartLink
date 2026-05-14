import { db, schema } from '@saas-immo/db'
import { eq, and, inArray } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import type { CreateAssetInput, UpdateAssetInput, AssetFilters } from '@saas-immo/schemas'

export async function getPublishedAssets(filters: AssetFilters) {
    const assets = await db
        .select()
        .from(schema.assets)
        .where(eq(schema.assets.status, 'PUBLISHED'))
        .limit(filters.pageSize)
        .offset((filters.page - 1) * filters.pageSize)

    return assets
}

export async function getAssetById(id: string) {
    const [asset] = await db
        .select()
        .from(schema.assets)
        .where(eq(schema.assets.id, id))

    if (!asset) return null

    const [details] = await db
        .select()
        .from(schema.propertyDetails)
        .where(eq(schema.propertyDetails.assetId, id))

    const media = await db
        .select()
        .from(schema.assetMedia)
        .where(eq(schema.assetMedia.assetId, id))

    const [tourOrder] = await db
        .select()
        .from(schema.virtualTourOrders)
        .where(eq(schema.virtualTourOrders.assetId, id))

    return { ...asset, propertyDetails: details ?? null, media, tourOrder: tourOrder ?? null }
}

export async function getAssetsByOwner(ownerId: string) {
    return db.select().from(schema.assets).where(eq(schema.assets.ownerId, ownerId))
}

export async function createAsset(ownerId: string, input: CreateAssetInput) {
    const id = createId()

    await db.insert(schema.assets).values({
        id,
        title: input.title,
        description: input.description,
        type: input.type,
        status: 'DRAFT',
        ownerId,
    })

    if (input.type === 'PROPERTY' && input.propertyDetails) {
        await db.insert(schema.propertyDetails).values({
            id: createId(),
            assetId: id,
            ...input.propertyDetails,
        })
    }

    return getAssetById(id)
}

export async function updateAsset(id: string, input: UpdateAssetInput) {
    await db
        .update(schema.assets)
        .set({
            title: input.title,
            description: input.description,
            updatedAt: new Date(),
        })
        .where(eq(schema.assets.id, id))

    if (input.propertyDetails) {
        await db
            .update(schema.propertyDetails)
            .set({ ...input.propertyDetails })
            .where(eq(schema.propertyDetails.assetId, id))
    }

    return getAssetById(id)
}

export async function archiveAsset(id: string) {
    await db
        .update(schema.assets)
        .set({ status: 'ARCHIVED', updatedAt: new Date() })
        .where(eq(schema.assets.id, id))
}

export async function addAssetMedia(
    assetId: string,
    media: { r2Key: string; mimeType: string; order: number }[]
) {
    const values = media.map((m) => ({ id: createId(), assetId, ...m }))
    await db.insert(schema.assetMedia).values(values)
}

export async function deleteAssetMedia(mediaId: string) {
    const [media] = await db
        .select()
        .from(schema.assetMedia)
        .where(eq(schema.assetMedia.id, mediaId))

    if (!media) return null

    await db.delete(schema.assetMedia).where(eq(schema.assetMedia.id, mediaId))

    return media
}
