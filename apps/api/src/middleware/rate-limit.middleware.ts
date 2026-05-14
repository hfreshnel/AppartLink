import type { MiddlewareHandler } from 'hono'
import { redis } from '../lib/redis'

type RateLimitOptions = {
    windowMs: number
    max: number
    keyPrefix: string
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
    return async (c, next) => {
        const ip =
            c.req.header('cf-connecting-ip') ??
            c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
            'unknown'

        const key = `rate:${opts.keyPrefix}:${ip}`
        const now = Date.now()
        const windowStart = now - opts.windowMs

        const pipe = redis.pipeline()
        pipe.zadd(key, now, `${now}-${Math.random()}`)
        pipe.zremrangebyscore(key, 0, windowStart)
        pipe.zcard(key)
        pipe.pexpire(key, opts.windowMs)

        const results = await pipe.exec()
        const count = (results?.[2]?.[1] as number) ?? 0

        if (count > opts.max) {
            return c.json({ error: 'Too many requests' }, 429)
        }

        return next()
    }
}

export const loginRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'login' })
export const registerRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'register' })
export const paymentRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyPrefix: 'payment' })
export const publicListingRateLimit = rateLimit({ windowMs: 60 * 1000, max: 100, keyPrefix: 'listing' })
