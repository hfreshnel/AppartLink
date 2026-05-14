import { createAuthClient } from 'better-auth/react'
import { env } from './env'

const API_URL = env.NEXT_PUBLIC_API_URL

const baseClient = createAuthClient({
    baseURL: `${API_URL}/auth`,
})

export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT'

// Better Auth's default session user type omits custom fields added to the schema.
// This type reflects the actual server response which includes `role`.
type BaseUser = typeof baseClient.$Infer.Session.user
type UserWithRole = BaseUser & { role: UserRole }
type SessionWithRole = { user: UserWithRole; session: typeof baseClient.$Infer.Session.session }

// Wrap useSession to return the full session type including custom role field
export function useSession() {
    return baseClient.useSession() as ReturnType<typeof baseClient.useSession> & {
        data: SessionWithRole | null
    }
}

export const { signIn, signUp, signOut, getSession } = baseClient
export const authClient = baseClient
