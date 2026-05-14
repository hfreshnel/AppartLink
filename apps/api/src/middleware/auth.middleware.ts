import type { MiddlewareHandler } from 'hono'
import type { SessionUser } from '@saas-immo/types'
import { auth } from '../lib/auth'

export type AuthVariables = {
    user: SessionUser
}

export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session?.user) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('user', {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as unknown as { role: SessionUser['role'] }).role ?? 'TENANT',
        image: session.user.image,
    })

    return next()
}

export const requireAdmin: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    const role = (session.user as unknown as { role: string }).role
    if (role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)

    c.set('user', {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: 'ADMIN',
        image: session.user.image,
    })

    return next()
}
