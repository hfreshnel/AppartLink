'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
    appName: z.string().min(2).max(60),
})

type FormValues = z.infer<typeof schema>

export function AppNameSettings() {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => api.get<{ data: Record<string, string> }>('/admin/settings'),
    })

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        values: { appName: data?.data?.['APP_NAME'] ?? 'AppartLink' },
    })

    const mutation = useMutation({
        mutationFn: (values: FormValues) =>
            api.patch('/admin/settings', { appName: values.appName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
            queryClient.invalidateQueries({ queryKey: ['app-name'] })
            toast({ title: 'Nom de la plateforme mis à jour' })
        },
        onError: () => {
            toast({ title: 'Erreur', description: 'Impossible de mettre à jour.', variant: 'destructive' })
        },
    })

    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold text-lg mb-4">Nom de la plateforme</h2>
            <p className="text-sm text-muted-foreground mb-4">
                Ce nom s'affiche dans la barre de navigation et les emails. La valeur par défaut est{' '}
                <strong>AppartLink</strong>.
            </p>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="appName">Nom de la plateforme</Label>
                    <Input
                        id="appName"
                        {...register('appName')}
                        placeholder="AppartLink"
                        disabled={isLoading}
                    />
                    {errors.appName && (
                        <p className="text-sm text-destructive">{errors.appName.message}</p>
                    )}
                </div>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </form>
        </div>
    )
}
