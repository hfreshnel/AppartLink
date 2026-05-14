import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createId } from '@paralleldrive/cuid2'
import { r2Client, BUCKETS, PRESIGN_EXPIRY_SECONDS, ALLOWED_MIME_TYPES, type AllowedMimeType } from '../lib/r2'
import { scanQueue } from '../workers/queues'

export async function generatePresignedUploadUrl(opts: {
    mimeType: string
    sizeBytes: number
    userId: string
}) {
    if (!ALLOWED_MIME_TYPES.includes(opts.mimeType as AllowedMimeType)) {
        throw new Error('MIME_TYPE_NOT_ALLOWED')
    }

    if (opts.sizeBytes > 10 * 1024 * 1024) {
        throw new Error('FILE_TOO_LARGE')
    }

    const key = `quarantine/${opts.userId}/${createId()}`

    const url = await getSignedUrl(
        r2Client,
        new PutObjectCommand({
            Bucket: BUCKETS.quarantine,
            Key: key,
            ContentType: opts.mimeType,
            ContentLength: opts.sizeBytes,
        }),
        { expiresIn: PRESIGN_EXPIRY_SECONDS }
    )

    return { url, key }
}

export async function generatePresignedDownloadUrl(bucket: keyof typeof BUCKETS, key: string) {
    return getSignedUrl(
        r2Client,
        new GetObjectCommand({ Bucket: BUCKETS[bucket], Key: key }),
        { expiresIn: PRESIGN_EXPIRY_SECONDS }
    )
}

export async function confirmUpload(opts: {
    documentId: string
    r2KeyQuarantine: string
    mimeType: string
    sizeBytes: number
}) {
    await scanQueue.add(
        'scan-document',
        {
            documentId: opts.documentId,
            r2KeyQuarantine: opts.r2KeyQuarantine,
            mimeType: opts.mimeType,
            sizeBytes: opts.sizeBytes,
        },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        }
    )
}
