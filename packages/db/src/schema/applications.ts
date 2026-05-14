import { integer, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { users } from './users'

export const applicationStatusEnum = pgEnum('application_status', [
    'DRAFT',
    'SUBMITTED',
    'SELECTED',
    'REJECTED',
    'WITHDRAWN',
])

export const documentTypeEnum = pgEnum('document_type', [
    'ID_CARD',
    'PROOF_OF_INCOME',
    'EMPLOYMENT_CONTRACT',
    'BANK_STATEMENT',
    'TAX_NOTICE',
    'OTHER',
])

export const documentStatusEnum = pgEnum('document_status', [
    'PENDING',
    'SCANNING',
    'VALIDATED',
    'REJECTED',
])

export const applications = pgTable(
    'applications',
    {
        id: text('id').primaryKey(),
        assetId: text('asset_id')
            .notNull()
            .references(() => assets.id),
        tenantId: text('tenant_id')
            .notNull()
            .references(() => users.id),
        status: applicationStatusEnum('status').notNull().default('DRAFT'),
        message: text('message'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [unique().on(t.assetId, t.tenantId)]
)

export const applicationDocuments = pgTable('application_documents', {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
        .notNull()
        .references(() => applications.id, { onDelete: 'cascade' }),
    type: documentTypeEnum('type').notNull(),
    status: documentStatusEnum('status').notNull().default('PENDING'),
    r2KeyQuarantine: text('r2_key_quarantine'),
    r2KeySafe: text('r2_key_safe'),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
