import { z } from 'zod'

const schema = z.object({
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = schema.parse(process.env)
