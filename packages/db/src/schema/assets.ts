import { boolean, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const assetTypeEnum = pgEnum('asset_type', ['PROPERTY', 'VEHICLE'])
export const assetStatusEnum = pgEnum('asset_status', [
    'DRAFT',
    'TOUR_PENDING',
    'PUBLISHED',
    'RENTED',
    'ARCHIVED',
])

export const assets = pgTable('assets', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    type: assetTypeEnum('type').notNull().default('PROPERTY'),
    status: assetStatusEnum('status').notNull().default('DRAFT'),
    ownerId: text('owner_id')
        .notNull()
        .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const propertyDetails = pgTable('property_details', {
    id: text('id').primaryKey(),
    assetId: text('asset_id')
        .notNull()
        .unique()
        .references(() => assets.id, { onDelete: 'cascade' }),
    surface: integer('surface'),
    rooms: integer('rooms'),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    floor: integer('floor'),
    totalFloors: integer('total_floors'),
    furnished: boolean('furnished').notNull().default(false),
    parking: boolean('parking').notNull().default(false),
    address: text('address').notNull(),
    city: text('city').notNull(),
    district: text('district'),
    rentAmount: integer('rent_amount').notNull(),
    charges: integer('charges').notNull().default(0),
    depositMonths: integer('deposit_months').notNull().default(2),
})

export const vehicleDetails = pgTable('vehicle_details', {
    id: text('id').primaryKey(),
    assetId: text('asset_id')
        .notNull()
        .unique()
        .references(() => assets.id, { onDelete: 'cascade' }),
})

export const assetMedia = pgTable('asset_media', {
    id: text('id').primaryKey(),
    assetId: text('asset_id')
        .notNull()
        .references(() => assets.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull(),
    mimeType: text('mime_type').notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
})
