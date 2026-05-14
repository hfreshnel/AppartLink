import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Tableau de bord locataire' }

export default function TenantDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
            <div className="grid gap-4 sm:grid-cols-2">
                <DashboardCard
                    href="/tenant/applications"
                    title="Mes candidatures"
                    description="Suivre l'état de vos dossiers"
                />
                <DashboardCard
                    href="/tenant/leases"
                    title="Mes baux"
                    description="Consulter vos contrats de location"
                />
            </div>
        </div>
    )
}

function DashboardCard({ href, title, description }: { href: string; title: string; description: string }) {
    return (
        <Link
            href={href}
            className="block rounded-lg border bg-card p-6 hover:border-primary transition-colors"
        >
            <h2 className="font-semibold text-lg">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </Link>
    )
}
