import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema/index'
import * as relations from './relations'
import { env } from './env'

const connectionString = env.DATABASE_URL

const client = postgres(connectionString, { max: 10 })

export const db = drizzle(client, { schema: { ...schema, ...relations } })

export { schema }
export * from './schema/index'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
