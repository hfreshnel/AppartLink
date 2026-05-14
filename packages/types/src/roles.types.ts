export type Role = 'TENANT' | 'OWNER' | 'ADMIN'

export type SessionUser = {
    id: string
    name: string
    email: string
    role: Role
    image?: string | null
}
