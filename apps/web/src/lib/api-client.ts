import { env } from './env'

const API_URL = env.NEXT_PUBLIC_API_URL

type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options

    const response = await fetch(`${API_URL}${path}`, {
        ...rest,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error((error as { error?: string }).error ?? 'Request failed')
    }

    return response.json() as Promise<T>
}

export const api = {
    get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
        request<T>(path, { method: 'GET', ...options }),

    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { method: 'POST', body, ...options }),

    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { method: 'PATCH', body, ...options }),

    delete: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { method: 'DELETE', ...options }),
}
