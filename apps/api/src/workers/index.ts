import { scanWorker } from './scan.worker'
import { emailWorker } from './email.worker'
import { pdfWorker } from './pdf.worker'
import { paymentWorker } from './payment.worker'

console.log('[workers] Starting all workers...')

const workers = [scanWorker, emailWorker, pdfWorker, paymentWorker]

for (const worker of workers) {
    worker.on('error', (err) => {
        console.error(`[workers] Worker error:`, err)
    })
}

process.on('SIGTERM', async () => {
    console.log('[workers] SIGTERM received — closing workers...')
    await Promise.all(workers.map((w) => w.close()))
    process.exit(0)
})

process.on('SIGINT', async () => {
    await Promise.all(workers.map((w) => w.close()))
    process.exit(0)
})

console.log('[workers] All workers running.')
