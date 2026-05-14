import { relations } from 'drizzle-orm'
import { users, sessions, accounts } from './schema/users'
import { assets, propertyDetails, vehicleDetails, assetMedia } from './schema/assets'
import { virtualTourOrders } from './schema/tours'
import { applications, applicationDocuments } from './schema/applications'
import { leases } from './schema/leases'
import { payments, escrows } from './schema/payments'

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    assets: many(assets),
    applications: many(applications),
    payments: many(payments),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const assetsRelations = relations(assets, ({ one, many }) => ({
    owner: one(users, { fields: [assets.ownerId], references: [users.id] }),
    propertyDetails: one(propertyDetails),
    vehicleDetails: one(vehicleDetails),
    media: many(assetMedia),
    tourOrder: one(virtualTourOrders),
    applications: many(applications),
    lease: one(leases),
}))

export const propertyDetailsRelations = relations(propertyDetails, ({ one }) => ({
    asset: one(assets, { fields: [propertyDetails.assetId], references: [assets.id] }),
}))

export const vehicleDetailsRelations = relations(vehicleDetails, ({ one }) => ({
    asset: one(assets, { fields: [vehicleDetails.assetId], references: [assets.id] }),
}))

export const assetMediaRelations = relations(assetMedia, ({ one }) => ({
    asset: one(assets, { fields: [assetMedia.assetId], references: [assets.id] }),
}))

export const virtualTourOrdersRelations = relations(virtualTourOrders, ({ one }) => ({
    asset: one(assets, { fields: [virtualTourOrders.assetId], references: [assets.id] }),
    payment: one(payments, { fields: [virtualTourOrders.id], references: [payments.tourOrderId] }),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
    asset: one(assets, { fields: [applications.assetId], references: [assets.id] }),
    tenant: one(users, { fields: [applications.tenantId], references: [users.id] }),
    documents: many(applicationDocuments),
    lease: one(leases),
    escrow: one(escrows),
}))

export const applicationDocumentsRelations = relations(applicationDocuments, ({ one }) => ({
    application: one(applications, {
        fields: [applicationDocuments.applicationId],
        references: [applications.id],
    }),
}))

export const leasesRelations = relations(leases, ({ one }) => ({
    asset: one(assets, { fields: [leases.assetId], references: [assets.id] }),
    application: one(applications, {
        fields: [leases.applicationId],
        references: [applications.id],
    }),
    payment: one(payments, { fields: [leases.id], references: [payments.leaseId] }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
    user: one(users, { fields: [payments.userId], references: [users.id] }),
    tourOrder: one(virtualTourOrders, {
        fields: [payments.tourOrderId],
        references: [virtualTourOrders.id],
    }),
    lease: one(leases, { fields: [payments.leaseId], references: [leases.id] }),
    escrow: one(escrows, { fields: [payments.escrowId], references: [escrows.id] }),
}))

export const escrowsRelations = relations(escrows, ({ one }) => ({
    application: one(applications, {
        fields: [escrows.applicationId],
        references: [applications.id],
    }),
    payment: one(payments, { fields: [escrows.id], references: [payments.escrowId] }),
}))
