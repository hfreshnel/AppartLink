'use client'

import { formatXOF, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'

type Asset = {
    id: string
    title: string
    description?: string | null
    status: string
    propertyDetails?: {
        address: string
        city: string
        district?: string | null
        rentAmount: number
        charges: number
        depositMonths: number
        surface?: number | null
        rooms?: number | null
        bedrooms?: number | null
        furnished: boolean
        parking: boolean
    } | null
    tourOrder?: {
        kuulaUrl?: string | null
        status: string
    } | null
}

type Props = { asset: Asset }

export function AssetDetail({ asset }: Props) {
    const { data: session } = useSession()
    const details = asset.propertyDetails

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{asset.title}</h1>
                {details && (
                    <p className="mt-1 text-muted-foreground">
                        {details.address} — {details.district ? `${details.district}, ` : ''}{details.city}
                    </p>
                )}
            </div>

            {asset.tourOrder?.kuulaUrl && asset.tourOrder.status === 'PUBLISHED' && (
                <div className="mb-6 rounded-lg overflow-hidden border aspect-video">
                    <iframe
                        src={asset.tourOrder.kuulaUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="xr-spatial-tracking"
                    />
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    {asset.description && (
                        <div className="rounded-lg border bg-card p-4">
                            <h2 className="font-semibold mb-2">Description</h2>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{asset.description}</p>
                        </div>
                    )}

                    {details && (
                        <div className="rounded-lg border bg-card p-4">
                            <h2 className="font-semibold mb-3">Caractéristiques</h2>
                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                {details.surface && (
                                    <>
                                        <dt className="text-muted-foreground">Surface</dt>
                                        <dd>{details.surface} m²</dd>
                                    </>
                                )}
                                {details.rooms && (
                                    <>
                                        <dt className="text-muted-foreground">Pièces</dt>
                                        <dd>{details.rooms}</dd>
                                    </>
                                )}
                                {details.bedrooms && (
                                    <>
                                        <dt className="text-muted-foreground">Chambres</dt>
                                        <dd>{details.bedrooms}</dd>
                                    </>
                                )}
                                <dt className="text-muted-foreground">Meublé</dt>
                                <dd>{details.furnished ? 'Oui' : 'Non'}</dd>
                                <dt className="text-muted-foreground">Parking</dt>
                                <dd>{details.parking ? 'Oui' : 'Non'}</dd>
                            </dl>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {details && (
                        <div className="rounded-lg border bg-card p-4">
                            <div className="text-2xl font-bold text-primary">
                                {formatXOF(details.rentAmount)}
                                <span className="text-sm font-normal text-muted-foreground"> / mois</span>
                            </div>
                            {details.charges > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    + {formatXOF(details.charges)} de charges
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                                Dépôt : {details.depositMonths} mois de loyer
                            </p>

                            {session?.user ? (
                                <Button className="w-full mt-4">Postuler</Button>
                            ) : (
                                <Button className="w-full mt-4" variant="outline" asChild>
                                    <a href="/login">Se connecter pour postuler</a>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
