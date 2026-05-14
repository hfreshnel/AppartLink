import { describe, it, expect } from 'vitest'
import { can } from '../lib/permissions'
import type { SessionUser } from '@saas-immo/types'

const admin: SessionUser = { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' }
const owner: SessionUser = { id: 'owner-1', name: 'Owner', email: 'owner@test.com', role: 'OWNER' }
const tenant: SessionUser = { id: 'tenant-1', name: 'Tenant', email: 'tenant@test.com', role: 'TENANT' }

describe('permissions', () => {
    it('admin can do everything', () => {
        expect(can(admin, 'asset:create')).toBe(true)
        expect(can(admin, 'lease:sign')).toBe(true)
        expect(can(admin, 'escrow:*')).toBe(true)
    })

    it('owner can manage own assets', () => {
        expect(can(owner, 'asset:update', { ownerId: 'owner-1' })).toBe(true)
        expect(can(owner, 'asset:update', { ownerId: 'other' })).toBe(false)
        expect(can(owner, 'asset:create')).toBe(true)
    })

    it('owner cannot sign leases', () => {
        expect(can(owner, 'lease:sign')).toBe(false)
    })

    it('tenant can create applications', () => {
        expect(can(tenant, 'application:create')).toBe(true)
    })

    it('tenant can only read own applications', () => {
        expect(can(tenant, 'application:read:own', { tenantId: 'tenant-1' })).toBe(true)
        expect(can(tenant, 'application:read:own', { tenantId: 'other' })).toBe(false)
    })

    it('owner can read documents only if application is submitted', () => {
        expect(
            can(owner, 'document:read', {
                ownerId: 'owner-1',
                applicationStatus: 'SUBMITTED',
            })
        ).toBe(true)

        expect(
            can(owner, 'document:read', {
                ownerId: 'owner-1',
                applicationStatus: 'DRAFT',
            })
        ).toBe(false)
    })

    it('public cannot access protected actions', () => {
        const publicUser: SessionUser = { id: 'pub', name: 'Pub', email: 'pub@test.com', role: 'TENANT' }
        expect(can(publicUser, 'lease:sign')).toBe(false)
        expect(can(publicUser, 'payment:commission:trigger')).toBe(false)
    })
})
