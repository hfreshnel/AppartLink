'use client'

import { useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function AssetFilters() {
    const { register, handleSubmit } = useForm()

    function onSubmit(data: unknown) {
        // TODO: update URL search params
        console.log(data)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4">
            <h2 className="font-semibold text-sm">Filtres</h2>

            <div className="space-y-1">
                <Label htmlFor="city" className="text-xs">Ville</Label>
                <Input id="city" {...register('city')} placeholder="Cotonou" className="h-8 text-sm" />
            </div>

            <div className="space-y-1">
                <Label htmlFor="minRent" className="text-xs">Loyer min (XOF)</Label>
                <Input id="minRent" type="number" {...register('minRent')} placeholder="0" className="h-8 text-sm" />
            </div>

            <div className="space-y-1">
                <Label htmlFor="maxRent" className="text-xs">Loyer max (XOF)</Label>
                <Input id="maxRent" type="number" {...register('maxRent')} placeholder="500 000" className="h-8 text-sm" />
            </div>

            <Button type="submit" size="sm" className="w-full">
                Rechercher
            </Button>
        </form>
    )
}
