import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env'

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
})

export const BUCKETS = {
    quarantine: env.R2_BUCKET_QUARANTINE,
    safe: env.R2_BUCKET_SAFE,
}

export const PRESIGN_EXPIRY_SECONDS = 15 * 60

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
