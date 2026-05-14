import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const siteSettings = pgTable('site_settings', {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const SETTING_KEYS = {
    APP_NAME: 'APP_NAME',
} as const

export const SETTING_DEFAULTS: Record<string, string> = {
    APP_NAME: 'AppartLink',
}
