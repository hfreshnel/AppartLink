import { describe, it, expect } from 'vitest'
import { calculateCommission } from '../services/lease.service'

describe('calculateCommission', () => {
    it('returns 15 000 XOF for rent < 100 000', () => {
        expect(calculateCommission(50_000)).toBe(15_000)
        expect(calculateCommission(99_999)).toBe(15_000)
    })

    it('returns 35 000 XOF for rent 100 000 – 300 000', () => {
        expect(calculateCommission(100_000)).toBe(35_000)
        expect(calculateCommission(200_000)).toBe(35_000)
        expect(calculateCommission(300_000)).toBe(35_000)
    })

    it('returns 60 000 XOF for rent > 300 000', () => {
        expect(calculateCommission(300_001)).toBe(60_000)
        expect(calculateCommission(500_000)).toBe(60_000)
    })
})
