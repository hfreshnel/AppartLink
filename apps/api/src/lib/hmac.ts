import { timingSafeEqual, createHmac } from 'node:crypto'
import { env } from './env'

export function verifyFedaPaySignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false

    const expected = createHmac('sha256', env.FEDAPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')

    if (expectedBuffer.length !== signatureBuffer.length) return false

    return timingSafeEqual(expectedBuffer, signatureBuffer)
}
