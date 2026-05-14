import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Administration' }

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Administration</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AdminCard href="/admin/users" title="Utilisateurs" description="Gérer les rôles" />
                <AdminCard href="/admin/assets" title="Biens" description="Superviser les annonces" />
                <AdminCard href="/admin/tours" title="Visites 3D" description="Gérer les commandes" />
                <AdminCard href="/admin/leases" title="Baux" description="Signer et archiver" />
                <AdminCard href="/admin/settings" title="Paramètres" description="Configurer la plateforme" />
            </div>
        </div>
    )
}

function AdminCard({ href, title, description }: { href: string; title: string; description: string }) {
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
