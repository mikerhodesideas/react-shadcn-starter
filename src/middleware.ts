// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Log all API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('API Request:', {
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}