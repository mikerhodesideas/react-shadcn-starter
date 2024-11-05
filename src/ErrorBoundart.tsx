// src/ErrorBoundart.tsx

import { useRouteError } from 'react-router-dom'

export default function ErrorBoundary() {
  const error = useRouteError() as Error
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg bg-destructive/10 p-8">
        <h1 className="mb-4 text-xl font-bold text-destructive">Something went wrong!</h1>
        <pre className="text-sm text-destructive/80">{error.message}</pre>
      </div>
    </div>
  )
}