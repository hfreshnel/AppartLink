import { Queue } from 'bullmq'
import { redis } from '../lib/redis'

const connection = redis

export const QUEUE_NAMES = {
    SCAN: 'scan-queue',
    EMAIL: 'email-queue',
    PDF: 'pdf-queue',
    PAYMENT: 'payment-queue',
} as const

export const scanQueue = new Queue(QUEUE_NAMES.SCAN, { connection })
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection })
export const pdfQueue = new Queue(QUEUE_NAMES.PDF, { connection })
export const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT, { connection })
