// Escrow flux — v1 structure present, all operations disabled pending legal validation (S-04)
// No API routes expose this service until S-04 is confirmed.

export function escrowNotAvailable(): never {
    throw new Error('ESCROW_NOT_AVAILABLE_V1')
}
