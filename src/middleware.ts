import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function withSupabaseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value)
  })
  return to
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const path = request.nextUrl.pathname
  const isAuth = path.startsWith('/login') || path.startsWith('/auth')

  if (!user && !isAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withSupabaseCookies(supabaseResponse, NextResponse.redirect(url))
  }
  if (user && isAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return withSupabaseCookies(supabaseResponse, NextResponse.redirect(url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
