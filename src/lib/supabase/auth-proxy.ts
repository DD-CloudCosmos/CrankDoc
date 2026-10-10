import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateAccountSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
        },
      },
    }
  )
  // Validate against Auth rather than trusting a user stored in the cookie.
  const { data, error } = await client.auth.getUser()
  const path = request.nextUrl.pathname
  if (error || !data.user) {
    let denied: NextResponse | null = null
    if (path === '/api/garage' || path.startsWith('/api/garage/')) {
      denied = NextResponse.json({ error: 'Sign in to access your garage.' }, { status: 401 })
    } else if (path === '/garage' || path.startsWith('/garage/')) {
      const url = new URL('/account', request.url)
      url.searchParams.set('next', `${path}${request.nextUrl.search}`)
      denied = NextResponse.redirect(url)
    }
    if (denied) {
      response.cookies.getAll().forEach((cookie) => denied!.cookies.set(cookie))
      for (const header of ['cache-control', 'expires', 'pragma']) {
        const value = response.headers.get(header)
        if (value) denied.headers.set(header, value)
      }
      response = denied
    }
  }
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
