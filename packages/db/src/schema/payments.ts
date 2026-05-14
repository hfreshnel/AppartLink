import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { virtualTourOrders } from './tours'
import { leases } from './leases'
import { applications } from './applications'

export const paymentTypeEnum = pgEnum('payment_type', ['TOUR_FEE', 'COMMISSION', 'ESCROW'])
export const paymentStatusEnum = pgEnum('payment_status', [
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED',
])
export const escrowStatusEnum = pgEnum('escrow_status', ['PENDING', 'HELD', 'RELEASED', 'REFUNDED'])

export const payments = pgTable('payments', {
    id: text('id').primaryKey(),
    type: paymentTypeEnum('type').notNull(),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    amount: integer('amount').notNull(),
    fedaPayTransactionId: text('fedapay_transaction_id').unique(),
    fedaPayCheckoutUrl: text('fedapay_checkout_url'),
    tourOrderId: text('tour_order_id')
        .unique()
        .references(() => virtualTourOrders.id),
    leaseId: text('lease_id')
        .unique()
        .references(() => leases.id),
    escrowId: text('escrow_id').unique(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Escrow — v1 structure only, flux disabled
export const escrows = pgTable('escrows', {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
        .notNull()
        .unique()
        .references(() => applications.id),
    amount: integer('amount').notNull(),
    status: escrowStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
