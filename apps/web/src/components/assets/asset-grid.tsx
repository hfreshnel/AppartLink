'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { AssetCard } from './asset-card'

export function AssetGrid() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['assets'],
        queryFn: () => api.get<{ data: unknown[] }>('/assets'),
    })

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card animate-pulse">
                        <div className="aspect-video bg-muted" />
                        <div className="p-4 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <p className="text-destructive text-sm">
                Impossible de charger les annonces. Veuillez réessayer.
            </p>
        )
    }

    const assets = data?.data ?? []

    if (assets.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                Aucune annonce disponible pour le moment.
            </p>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
                <AssetCard key={(asset as { id: string }).id} asset={asset as Parameters<typeof AssetCard>[0]['asset']} />
            ))}
        </div>
    )
}
