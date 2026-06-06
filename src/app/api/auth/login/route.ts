import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
