import { Worker, type Job } from 'bullmq'
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createWriteStream, createReadStream } from 'node:fs'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { redis } from '../lib/redis'
import { r2Client, BUCKETS, ALLOWED_MIME_TYPES, type AllowedMimeType } from '../lib/r2'
import { emailQueue } from './queues'

const execAsync = promisify(exec)

type ScanJobPayload = {
    documentId: string
    r2KeyQuarantine: string
    mimeType: string
    sizeBytes: number
}

async function downloadFromR2(key: string): Promise<Buffer> {
    const response = await r2Client.send(
        new GetObjectCommand({ Bucket: BUCKETS.quarantine, Key: key })
    )
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

async function processDocument(job: Job<ScanJobPayload>): Promise<void> {
    const { documentId, r2KeyQuarantine, mimeType, sizeBytes } = job.data

    if (sizeBytes > 10 * 1024 * 1024) {
        throw new Error('File exceeds 10 MB limit')
    }

    const fileBuffer = await downloadFromR2(r2KeyQuarantine)

    const detectedType = await fileTypeFromBuffer(fileBuffer)
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime as AllowedMimeType)) {
        await markRejected(documentId, r2KeyQuarantine)
        return
    }

    let processedBuffer = fileBuffer
    if (detectedType.mime === 'image/jpeg' || detectedType.mime === 'image/png') {
        processedBuffer = await sharp(fileBuffer).withMetadata({}).toBuffer()
    }

    const tmpPath = join(tmpdir(), `scan-${documentId}`)
    await writeFile(tmpPath, processedBuffer)

    try {
        await execAsync(`clamscan --no-summary ${tmpPath}`)
    } catch {
        await unlink(tmpPath).catch(() => undefined)
        await markRejected(documentId, r2KeyQuarantine)
        return
    }

    await unlink(tmpPath).catch(() => undefined)

    const safeKey = r2KeyQuarantine.replace('quarantine/', 'safe/')
    await r2Client.send(
        new PutObjectCommand({
            Bucket: BUCKETS.safe,
            Key: safeKey,
            Body: processedBuffer,
            ContentType: mimeType,
        })
    )

    await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKETS.quarantine, Key: r2KeyQuarantine }))

    await db
        .update(schema.applicationDocuments)
        .set({ status: 'VALIDATED', r2KeySafe: safeKey, r2KeyQuarantine: null, updatedAt: new Date() })
        .where(eq(schema.applicationDocuments.id, documentId))

    const [doc] = await db
        .select({ applicationId: schema.applicationDocuments.applicationId })
        .from(schema.applicationDocuments)
        .where(eq(schema.applicationDocuments.id, documentId))

    if (doc) {
        await emailQueue.add('document-validated', {
            documentId,
            applicationId: doc.applicationId,
        })
    }
}

async function markRejected(documentId: string, r2KeyQuarantine: string): Promise<void> {
    await r2Client
        .send(new DeleteObjectCommand({ Bucket: BUCKETS.quarantine, Key: r2KeyQuarantine }))
        .catch(() => undefined)

    await db
        .update(schema.applicationDocuments)
        .set({ status: 'REJECTED', r2KeyQuarantine: null, updatedAt: new Date() })
        .where(eq(schema.applicationDocuments.id, documentId))

    const [doc] = await db
        .select({ applicationId: schema.applicationDocuments.applicationId })
        .from(schema.applicationDocuments)
        .where(eq(schema.applicationDocuments.id, documentId))

    if (doc) {
        await emailQueue.add('document-rejected', {
            documentId,
            applicationId: doc.applicationId,
        })
    }
}

export const scanWorker = new Worker('scan-queue', processDocument, {
    connection: redis,
    concurrency: 2,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
})

scanWorker.on('failed', (job, err) => {
    console.error(`[scan-worker] Job ${job?.id} failed:`, err.message)
})
