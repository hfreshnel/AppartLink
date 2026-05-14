import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AssetDetail } from '@/components/assets/asset-detail'

type Props = {
    params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'
    try {
        const res = await fetch(`${API_URL}/assets/${params.id}`, { next: { revalidate: 60 } })
        if (!res.ok) return { title: 'Bien introuvable' }
        const { data } = await res.json()
        return { title: data.title }
    } catch {
        return { title: 'Bien' }
    }
}

async function getAsset(id: string) {
    const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'
    const res = await fetch(`${API_URL}/assets/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const { data } = await res.json()
    return data
}

export default async function AssetPage({ params }: Props) {
    const asset = await getAsset(params.id)
    if (!asset) notFound()

    return <AssetDetail asset={asset} />
}
