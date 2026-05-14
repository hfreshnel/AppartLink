import { db, schema } from '@saas-immo/db'
import { eq } from 'drizzle-orm'
import { SETTING_KEYS, SETTING_DEFAULTS } from '@saas-immo/db'
import { createId } from '@paralleldrive/cuid2'

export async function getSetting(key: string): Promise<string> {
    const [row] = await db
        .select({ value: schema.siteSettings.value })
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, key))

    return row?.value ?? SETTING_DEFAULTS[key] ?? ''
}

export async function getAppName(): Promise<string> {
    return getSetting(SETTING_KEYS.APP_NAME)
}

export async function updateSetting(key: string, value: string): Promise<void> {
    const [existing] = await db
        .select({ id: schema.siteSettings.id })
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.key, key))

    if (existing) {
        await db
            .update(schema.siteSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(schema.siteSettings.key, key))
    } else {
        await db.insert(schema.siteSettings).values({
            id: createId(),
            key,
            value,
        })
    }
}

export async function getAllSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(schema.siteSettings)
    const result: Record<string, string> = { ...SETTING_DEFAULTS }
    for (const row of rows) {
        result[row.key] = row.value
    }
    return result
}
