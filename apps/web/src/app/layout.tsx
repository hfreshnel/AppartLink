import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const APP_NAME = 'AppartLink'

export const metadata: Metadata = {
    title: {
        default: APP_NAME,
        template: `%s — ${APP_NAME}`,
    },
    description: 'Plateforme immobilière avec visite virtuelle 3D — Cotonou, Bénin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
