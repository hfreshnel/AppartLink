import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db, schema } from '@saas-immo/db'
import { env } from './env'

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/auth',
    trustedOrigins: [env.WEB_URL],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        },
    },
    advanced: {
        defaultCookieAttributes: {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
        },
    },
})

export type Auth = typeof auth
