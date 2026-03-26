import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getHomeByRole } from '@/lib/role-redirect'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authRoutes = ['/auth/login', '/auth/sign-up', '/auth/sign-up-admin', '/auth/sign-up-success', '/auth/error']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() valida o token junto ao Supabase Auth — seguro e correto
  const { data: { user } } = await supabase.auth.getUser()

  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  // Rotas protegidas sem sessão → login
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/portal')
  if (isProtected && !user) return redirect('/auth/login')

  // Rotas de auth com sessão ativa → destino por role (sem passar pela raiz)
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, slug')
      .eq('id', user.id)
      .single()
    return redirect(getHomeByRole(profile?.role ?? 'user', profile?.slug))
  }

  // Área admin → logado com role insuficiente → destino correto
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, slug')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'user'
    if (role !== 'admin' && role !== 'bdr_admin') {
      return redirect(getHomeByRole(role, profile?.slug))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$)(?!$).*)',
  ],
}
