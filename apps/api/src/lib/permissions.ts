import type { SessionUser } from '@saas-immo/types'

type Action =
    | 'asset:read:published'
    | 'asset:read:own'
    | 'asset:create'
    | 'asset:update'
    | 'asset:delete'
    | 'tour:create'
    | 'tour:update'
    | 'application:create'
    | 'application:read:own'
    | 'application:read:received'
    | 'application:select'
    | 'document:read'
    | 'document:upload'
    | 'lease:create'
    | 'lease:read:own'
    | 'lease:sign'
    | 'lease:archive'
    | 'payment:tour:create'
    | 'payment:commission:trigger'
    | 'escrow:*'
    | 'admin:*'
    | 'settings:update'

type Resource = {
    ownerId?: string
    tenantId?: string
    userId?: string
    applicationStatus?: string
}

export function can(user: SessionUser, action: Action, resource?: Resource): boolean {
    if (user.role === 'ADMIN') return true

    switch (action) {
        case 'asset:read:published':
            return true

        case 'asset:read:own':
        case 'asset:update':
        case 'asset:delete':
        case 'tour:create':
        case 'payment:tour:create':
            if (user.role !== 'OWNER') return false
            if (!resource?.ownerId) return false
            return resource.ownerId === user.id

        case 'asset:create':
            return user.role === 'OWNER'

        case 'application:create':
            return user.role === 'TENANT'

        case 'application:read:own':
            if (user.role !== 'TENANT') return false
            if (!resource?.tenantId) return false
            return resource.tenantId === user.id

        case 'application:read:received':
        case 'application:select':
        case 'lease:create':
            if (user.role !== 'OWNER') return false
            if (!resource?.ownerId) return false
            return resource.ownerId === user.id

        case 'document:read':
            if (user.role === 'TENANT') return resource?.tenantId === user.id
            if (user.role === 'OWNER') {
                const validStatuses = ['SUBMITTED', 'SELECTED', 'REJECTED']
                return (
                    resource?.ownerId === user.id &&
                    !!resource.applicationStatus &&
                    validStatuses.includes(resource.applicationStatus)
                )
            }
            return false

        case 'document:upload':
            if (user.role !== 'TENANT') return false
            return resource?.tenantId === user.id

        case 'lease:read:own':
            if (!resource?.userId) return false
            return resource.userId === user.id

        case 'tour:update':
        case 'lease:sign':
        case 'lease:archive':
        case 'payment:commission:trigger':
        case 'escrow:*':
        case 'admin:*':
        case 'settings:update':
            return false

        default:
            return false
    }
}
