import { Worker, type Job } from 'bullmq'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import PDFDocument from 'pdfkit'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { redis } from '../lib/redis'
import { r2Client, BUCKETS } from '../lib/r2'
import { emailQueue } from './queues'

type PdfJobPayload = {
    leaseId: string
}

async function generateLeasePdf(job: Job<PdfJobPayload>): Promise<void> {
    const { leaseId } = job.data

    const [lease] = await db
        .select()
        .from(schema.leases)
        .where(eq(schema.leases.id, leaseId))

    if (!lease) throw new Error(`Lease ${leaseId} not found`)

    const [application] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, lease.applicationId))

    const [asset] = await db
        .select()
        .from(schema.assets)
        .where(eq(schema.assets.id, lease.assetId))

    const [owner] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, asset?.ownerId ?? ''))

    const [tenant] = application
        ? await db
              .select()
              .from(schema.users)
              .where(eq(schema.users.id, application.tenantId))
        : []

    const pdfBuffer = await buildPdf({ lease, asset, owner, tenant })

    const r2Key = `leases/${leaseId}/bail.pdf`

    await r2Client.send(
        new PutObjectCommand({
            Bucket: BUCKETS.safe,
            Key: r2Key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
        })
    )

    await db
        .update(schema.leases)
        .set({
            r2KeyPdf: r2Key,
            status: 'ARCHIVED',
            archivedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(schema.leases.id, leaseId))

    await emailQueue.add('lease-signed', { leaseId })
}

async function buildPdf(data: {
    lease: (typeof schema.leases.$inferSelect) | undefined
    asset: (typeof schema.assets.$inferSelect) | undefined
    owner: (typeof schema.users.$inferSelect) | undefined
    tenant: (typeof schema.users.$inferSelect) | undefined
}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 })
        const chunks: Buffer[] = []

        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        doc.fontSize(20).font('Helvetica-Bold').text('CONTRAT DE BAIL', { align: 'center' })
        doc.moveDown(2)

        doc.fontSize(12).font('Helvetica')
        doc.text(`Bien : ${data.asset?.title ?? '-'}`)
        doc.text(`Propriétaire : ${data.owner?.name ?? '-'}`)
        doc.text(`Locataire : ${data.tenant?.name ?? '-'}`)
        doc.moveDown()

        if (data.lease) {
            doc.text(`Date de début : ${data.lease.startDate.toLocaleDateString('fr-FR')}`)
            doc.text(`Loyer mensuel : ${data.lease.rentAmount.toLocaleString('fr-FR')} XOF`)
            doc.text(`Charges : ${data.lease.chargesAmount.toLocaleString('fr-FR')} XOF`)
            doc.text(`Dépôt de garantie : ${data.lease.depositAmount.toLocaleString('fr-FR')} XOF`)
        }

        if (data.lease?.terms) {
            doc.moveDown()
            doc.font('Helvetica-Bold').text('Conditions particulières :')
            doc.font('Helvetica').text(data.lease.terms)
        }

        doc.end()
    })
}

export const pdfWorker = new Worker('pdf-queue', generateLeasePdf, {
    connection: redis,
    concurrency: 1,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 10000 },
    },
})

pdfWorker.on('failed', (job, err) => {
    console.error(`[pdf-worker] Job ${job?.id} failed:`, err.message)
})
