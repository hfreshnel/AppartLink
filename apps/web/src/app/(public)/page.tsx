import { Suspense } from 'react'
import { AssetGrid } from '@/components/assets/asset-grid'
import { AssetFilters } from '@/components/assets/asset-filters'

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">
                    Trouvez votre logement idéal
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Visitez en 3D avant de postuler — Cotonou et ses environs
                </p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="w-full lg:w-64 shrink-0">
                    <AssetFilters />
                </aside>
                <div className="flex-1">
                    <Suspense fallback={<div className="text-muted-foreground">Chargement...</div>}>
                        <AssetGrid />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
