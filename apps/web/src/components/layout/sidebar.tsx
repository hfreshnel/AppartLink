'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const ownerLinks = [
    { href: '/owner', label: 'Tableau de bord' },
    { href: '/owner/assets', label: 'Mes biens' },
    { href: '/owner/applications', label: 'Candidatures' },
    { href: '/owner/leases', label: 'Baux' },
]

const tenantLinks = [
    { href: '/tenant', label: 'Tableau de bord' },
    { href: '/tenant/applications', label: 'Mes candidatures' },
    { href: '/tenant/leases', label: 'Mes baux' },
]

const adminLinks = [
    { href: '/admin', label: 'Tableau de bord' },
    { href: '/admin/users', label: 'Utilisateurs' },
    { href: '/admin/assets', label: 'Biens' },
    { href: '/admin/tours', label: 'Visites 3D' },
    { href: '/admin/leases', label: 'Baux' },
    { href: '/admin/settings', label: 'Paramètres' },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const role = (session?.user as unknown as { role?: string })?.role ?? 'TENANT'
    const links = role === 'ADMIN' ? adminLinks : role === 'OWNER' ? ownerLinks : tenantLinks

    return (
        <aside className="hidden w-56 shrink-0 border-r bg-muted/20 lg:flex lg:flex-col">
            <div className="flex h-14 items-center border-b px-4">
                <Link href="/" className="font-bold text-primary">
                    AppartLink
                </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            pathname === link.href
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
        </aside>
    )
}
