// Load env from apps/api if DATABASE_URL is not already set
if (!process.env['DATABASE_URL']) {
    const { config } = await import('dotenv')
    config({ path: '../../apps/api/.env' })
}

import { hashPassword } from '@better-auth/utils/password'
import { createId } from '@paralleldrive/cuid2'
import { db, schema } from './index'
import { SETTING_DEFAULTS } from './schema/settings'

const DEFAULT_USERS: Array<{
    name: string
    email: string
    password: string
    role: 'ADMIN' | 'OWNER' | 'TENANT'
}> = [
    {
        name: process.env['SEED_ADMIN_NAME'] ?? 'Administrateur',
        email: process.env['SEED_ADMIN_EMAIL'] ?? 'admin@appartlink.com',
        password: process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin1234!',
        role: 'ADMIN',
    },
    {
        name: process.env['SEED_OWNER_NAME'] ?? 'Propriétaire Test',
        email: process.env['SEED_OWNER_EMAIL'] ?? 'owner@appartlink.com',
        password: process.env['SEED_OWNER_PASSWORD'] ?? 'Owner1234!',
        role: 'OWNER',
    },
    {
        name: process.env['SEED_TENANT_NAME'] ?? 'Locataire Test',
        email: process.env['SEED_TENANT_EMAIL'] ?? 'tenant@appartlink.com',
        password: process.env['SEED_TENANT_PASSWORD'] ?? 'Tenant1234!',
        role: 'TENANT',
    },
]

async function seedUser(user: (typeof DEFAULT_USERS)[number]) {
    const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(
            (await import('drizzle-orm')).eq(schema.users.email, user.email)
        )

    if (existing.length > 0) {
        console.log(`  [skip] ${user.email} already exists`)
        return
    }

    const passwordHash = await hashPassword(user.password)

    const userId = createId()
    const accountId = createId()

    await db.insert(schema.users).values({
        id: userId,
        name: user.name,
        email: user.email,
        emailVerified: true,
        role: user.role,
    })

    await db.insert(schema.accounts).values({
        id: accountId,
        accountId: userId,
        providerId: 'credential',
        userId,
        password: passwordHash,
    })

    console.log(`  [created] ${user.role.padEnd(6)} — ${user.email}`)
}

async function seedSettings() {
    for (const [key, defaultValue] of Object.entries(SETTING_DEFAULTS)) {
        const existing = await db
            .select({ id: schema.siteSettings.id })
            .from(schema.siteSettings)
            .where((await import('drizzle-orm')).eq(schema.siteSettings.key, key))

        if (existing.length > 0) {
            console.log(`  [skip] setting ${key} already set`)
            continue
        }

        await db.insert(schema.siteSettings).values({
            id: createId(),
            key,
            value: defaultValue,
        })

        console.log(`  [created] setting ${key} = "${defaultValue}"`)
    }
}

async function main() {
    console.log('Seeding database...\n')

    console.log('Users:')
    for (const user of DEFAULT_USERS) {
        await seedUser(user)
    }

    console.log('\nSettings:')
    await seedSettings()

    console.log('\nDone.')
    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
