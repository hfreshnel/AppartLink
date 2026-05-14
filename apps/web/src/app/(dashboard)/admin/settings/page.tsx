import type { Metadata } from 'next'
import { AppNameSettings } from '@/components/admin/app-name-settings'

export const metadata: Metadata = { title: 'Paramètres — Administration' }

export default function AdminSettingsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Paramètres de la plateforme</h1>
            <div className="max-w-xl space-y-6">
                <AppNameSettings />
            </div>
        </div>
    )
}
