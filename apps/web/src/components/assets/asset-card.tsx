import Link from 'next/link'
import { formatXOF } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type AssetCardProps = {
    asset: {
        id: string
        title: string
        status: string
        propertyDetails?: {
            city: string
            district?: string | null
            rentAmount: number
            rooms?: number | null
            surface?: number | null
        } | null
    }
}

export function AssetCard({ asset }: AssetCardProps) {
    const details = asset.propertyDetails

    return (
        <Link href={`/assets/${asset.id}`} className="group block">
            <div className="rounded-lg border bg-card overflow-hidden hover:border-primary transition-colors">
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    Visite 3D disponible
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {asset.title}
                    </h3>
                    {details && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {details.district ? `${details.district}, ` : ''}{details.city}
                        </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                        {details && (
                            <span className="font-semibold text-primary">
                                {formatXOF(details.rentAmount)} / mois
                            </span>
                        )}
                        <div className="flex gap-2 text-xs text-muted-foreground">
                            {details?.rooms && <span>{details.rooms} pièces</span>}
                            {details?.surface && <span>{details.surface} m²</span>}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
