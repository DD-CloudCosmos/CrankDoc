import { NextResponse, type NextRequest } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase/auth-server'
import { safeReturnPath } from '@/lib/account'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin
  let path = '/account?error=invalid-link'
  if (code) {
    const client = await createAuthServerClient()
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (!error) path = safeReturnPath(request.nextUrl.searchParams.get('next'))
  }
  const response = NextResponse.redirect(new URL(path, origin))
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
