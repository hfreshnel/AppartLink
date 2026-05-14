import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { assets } from './assets'

export const tourOrderStatusEnum = pgEnum('tour_order_status', [
    'PENDING_PAYMENT',
    'PAID',
    'SCHEDULED',
    'SHOT',
    'PUBLISHED',
])

export const virtualTourOrders = pgTable('virtual_tour_orders', {
    id: text('id').primaryKey(),
    assetId: text('asset_id')
        .notNull()
        .unique()
        .references(() => assets.id),
    status: tourOrderStatusEnum('status').notNull().default('PENDING_PAYMENT'),
    kuulaUrl: text('kuula_url'),
    scheduledAt: timestamp('scheduled_at'),
    shotAt: timestamp('shot_at'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
