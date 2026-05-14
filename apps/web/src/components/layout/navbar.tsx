'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

const DEFAULT_APP_NAME = 'AppartLink'

export function Navbar() {
    const { data: session } = useSession()

    const { data } = useQuery({
        queryKey: ['app-name'],
        queryFn: () => api.get<{ data: Record<string, string> }>('/admin/settings'),
        staleTime: 5 * 60 * 1000,
    })

    const appName = data?.data?.['APP_NAME'] ?? DEFAULT_APP_NAME

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container mx-auto flex h-14 items-center justify-between px-4">
                <Link href="/" className="text-xl font-bold text-primary">
                    {appName}
                </Link>

                <nav className="flex items-center gap-4">
                    {session?.user ? (
                        <>
                            <Link
                                href={`/${session.user.role === 'ADMIN' ? 'admin' : session.user.role === 'OWNER' ? 'owner' : 'tenant'}`}
                                className="text-sm font-medium hover:text-primary"
                            >
                                Mon espace
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => signOut()}
                            >
                                Déconnexion
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium hover:text-primary">
                                Connexion
                            </Link>
                            <Button asChild size="sm">
                                <Link href="/register">S'inscrire</Link>
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}
