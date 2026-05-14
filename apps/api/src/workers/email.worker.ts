import { Worker, type Job } from 'bullmq'
import { render } from '@react-email/render'
import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import {
    ApplicationSubmittedEmail,
    ApplicationSelectedEmail,
    ApplicationRejectedEmail,
    DocumentValidatedEmail,
    DocumentRejectedEmail,
    LeaseCreatedEmail,
    LeaseSignedEmail,
    TourScheduledEmail,
    TourPublishedEmail,
    CommissionRequestedEmail,
    PaymentSucceededEmail,
} from '@saas-immo/emails'
import { resend, FROM_EMAIL } from '../lib/resend'
import { redis } from '../lib/redis'

import { env } from '../lib/env'

const APP_NAME = 'AppartLink'
const APP_URL = env.BETTER_AUTH_URL

async function processEmail(job: Job): Promise<void> {
    const { name, data } = job

    const idempotencyKey = `email-${job.id}`

    switch (name) {
        case 'application-submitted': {
            const [application] = await db
                .select()
                .from(schema.applications)
                .where(eq(schema.applications.id, data.applicationId))

            if (!application) return

            const [asset] = await db
                .select()
                .from(schema.assets)
                .where(eq(schema.assets.id, application.assetId))

            const [owner] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, asset?.ownerId ?? ''))

            const [tenant] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, application.tenantId))

            if (!owner || !tenant || !asset) return

            await resend.emails.send({
                from: FROM_EMAIL,
                to: owner.email,
                subject: `Nouveau dossier — ${asset.title}`,
                html: await render(
                    ApplicationSubmittedEmail({
                        ownerName: owner.name,
                        tenantName: tenant.name,
                        assetTitle: asset.title,
                        applicationUrl: `${APP_URL}/owner/applications/${application.id}`,
                        appName: APP_NAME,
                    })
                ),
                headers: { 'X-Entity-Ref-ID': idempotencyKey },
            })
            break
        }

        case 'application-selected': {
            const [application] = await db
                .select()
                .from(schema.applications)
                .where(eq(schema.applications.id, data.applicationId))

            if (!application) return

            const [asset] = await db
                .select()
                .from(schema.assets)
                .where(eq(schema.assets.id, application.assetId))

            const [tenant] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, application.tenantId))

            if (!tenant || !asset) return

            await resend.emails.send({
                from: FROM_EMAIL,
                to: tenant.email,
                subject: `Félicitations — votre dossier a été retenu`,
                html: await render(
                    ApplicationSelectedEmail({
                        tenantName: tenant.name,
                        assetTitle: asset.title,
                        leaseUrl: `${APP_URL}/tenant/applications/${application.id}`,
                        appName: APP_NAME,
                    })
                ),
                headers: { 'X-Entity-Ref-ID': idempotencyKey },
            })
            break
        }

        default:
            console.warn(`[email-worker] Unknown job name: ${name}`)
    }
}

export const emailWorker = new Worker('email-queue', processEmail, {
    connection: redis,
    concurrency: 5,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
    },
})

emailWorker.on('failed', (job, err) => {
    console.error(`[email-worker] Job ${job?.id} failed:`, err.message)
})
