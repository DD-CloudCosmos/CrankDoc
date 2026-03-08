import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { password?: string }
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Hash before comparing to prevent length oracle and timing attacks
    const passwordHash = crypto.createHash('sha256').update(password).digest()
    const adminHash = crypto.createHash('sha256').update(adminPassword).digest()
    const isMatch = crypto.timingSafeEqual(passwordHash, adminHash)

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    const sessionSecret = process.env.ADMIN_SESSION_SECRET

    if (!sessionSecret) {
      console.error('ADMIN_SESSION_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const isProduction = process.env.NODE_ENV === 'production'

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin-token', sessionSecret, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
