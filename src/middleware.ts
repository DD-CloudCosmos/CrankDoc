import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

function tokensMatch(a: string, b: string): boolean {
  const aHash = crypto.createHash('sha256').update(a).digest()
  const bHash = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(aHash, bHash)
}

export function middleware(request: NextRequest) {
  // Only protect /admin routes (except the login page itself)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')
  ) {
    const adminToken = request.cookies.get('admin-token')?.value
    const expectedToken = process.env.ADMIN_SESSION_SECRET

    if (!adminToken || !expectedToken || !tokensMatch(adminToken, expectedToken)) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
