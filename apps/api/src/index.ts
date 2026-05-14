import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './lib/env'
import { auth } from './lib/auth'
import { assetsRouter } from './routes/assets'
import { applicationsRouter } from './routes/applications'
import { leasesRouter } from './routes/leases'
import { toursRouter } from './routes/tours'
import { uploadsRouter } from './routes/uploads'
import { paymentsRouter } from './routes/payments'
import { webhooksRouter } from './routes/webhooks'
import { adminRouter } from './routes/admin'

const app = new Hono()

app.use('*', logger())

app.use(
    '*',
    cors({
        origin: env.WEB_URL,
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
        credentials: true,
    })
)

// Security headers
app.use('*', async (c, next) => {
    await next()
    c.header('X-Frame-Options', 'DENY')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'strict-origin')
    c.header('Permissions-Policy', 'camera=(), microphone=()')
    c.header('Content-Security-Policy', "default-src 'self'; frame-src kuula.co")
})

// Better Auth handler
app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))

// Routes
app.route('/assets', assetsRouter)
app.route('/applications', applicationsRouter)
app.route('/leases', leasesRouter)
app.route('/tours', toursRouter)
app.route('/uploads', uploadsRouter)
app.route('/payments', paymentsRouter)
app.route('/webhooks', webhooksRouter)
app.route('/admin', adminRouter)

app.get('/health', (c) => c.json({ status: 'ok' }))

const port = env.PORT

serve({ fetch: app.fetch, port }, () => {
    console.log(`[api] Server running on http://localhost:${port}`)
})

export default app
