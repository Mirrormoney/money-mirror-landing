// middleware.ts (project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Turn the wall on/off via env var
  if (process.env.ENABLE_PASSWORD !== '1') return NextResponse.next()

  const auth = req.headers.get('authorization')
  if (auth && auth.startsWith('Basic ')) {
    const [, encoded] = auth.split(' ')
    // Decode "username:password" from Basic Auth header
    const [user, ...rest] = atob(encoded).split(':')
    const pass = rest.join(':')
    if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MirrorMoney Staging"' },
  })
}

// Don’t guard static assets/robots
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
