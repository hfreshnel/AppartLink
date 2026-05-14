'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            const result = await signIn.email({
                email: values.email,
                password: values.password,
            })

            if (result.error) {
                toast({ title: 'Erreur', description: result.error.message, variant: 'destructive' })
                return
            }

            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-lg border bg-card p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Connexion</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="vous@exemple.com" />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" type="password" {...register('password')} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-primary hover:underline">
                    S'inscrire
                </Link>
            </p>
        </div>
    )
}
