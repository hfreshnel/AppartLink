import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { applications } from './applications'

export const leaseStatusEnum = pgEnum('lease_status', ['DRAFT', 'SIGNED', 'ARCHIVED'])

export const leases = pgTable('leases', {
    id: text('id').primaryKey(),
    assetId: text('asset_id')
        .notNull()
        .unique()
        .references(() => assets.id),
    applicationId: text('application_id')
        .notNull()
        .unique()
        .references(() => applications.id),
    status: leaseStatusEnum('status').notNull().default('DRAFT'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    rentAmount: integer('rent_amount').notNull(),
    chargesAmount: integer('charges_amount').notNull().default(0),
    depositAmount: integer('deposit_amount').notNull(),
    terms: text('terms'),
    r2KeyPdf: text('r2_key_pdf'),
    signedAt: timestamp('signed_at'),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
