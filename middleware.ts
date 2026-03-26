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

  // getSession lê do cookie sem roundtrip — evita rate limit do Supabase Auth
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Rota de auth → já logado: redireciona para a API que resolve o destino por role
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/api/auth/me'
    // Não podemos aguardar a API aqui — usamos o redirect para a raiz
    // que por sua vez consulta o role via app/route.ts
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Área portal (clientes) → não logado: redireciona para login
  if (pathname.startsWith('/portal') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Área admin → não logado: redireciona para login
  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Área admin → logado mas sem role admin/bdr_admin: busca o profile e redireciona
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, slug')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'user'
    if (role !== 'admin' && role !== 'bdr_admin') {
      const url = request.nextUrl.clone()
      url.pathname = getHomeByRole(role, profile?.slug)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$)(?!$).*)',
  ],
}
