import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    outputFileTracingRoot: path.join(__dirname, '../../'),
    transpilePackages: ['@saas-immo/schemas', '@saas-immo/types'],
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
                    {
                        key: 'Content-Security-Policy',
                        value: `default-src 'self'; connect-src 'self' ${apiUrl}; frame-src kuula.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`,
                    },
                ],
            },
        ]
    },
}

export default nextConfig
