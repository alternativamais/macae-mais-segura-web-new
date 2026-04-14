import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales, localeCookieName } from './lib/i18n/config'
import {
  AUTH_COOKIE_KEY,
  AUTH_REDIRECT_REASON,
  buildSafeNextPath,
  buildSignInPath,
  isTokenExpired,
} from './lib/auth-session'

// Adicione aqui as rotas que NÃO precisam de login
const publicRoutes = ['/sign-in', '/unauthorized', '/forbidden']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Gerenciamento de Locale (i18n)
  let locale = request.cookies.get(localeCookieName)?.value
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale
  }

  // 2. Verificar se a rota é pública
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // 3. Pegar o token do cookie (Edge compatível)
  const token = request.cookies.get(AUTH_COOKIE_KEY)?.value
  const tokenExpired = token ? isTokenExpired(token) : false
  const nextPath = buildSafeNextPath(pathname, request.nextUrl.search)

  // 4. Redirecionar rotas antigas para a nova
  if (pathname === '/login' || pathname.startsWith('/auth/sign-in') || pathname === '/sign-in-3') {
    const response = NextResponse.redirect(new URL('/sign-in', request.url))
    response.cookies.set(localeCookieName, locale)
    return response
  }

  // 5. Sessão ausente ou expirada sempre volta ao login
  if (!isPublicRoute && (!token || tokenExpired)) {
    const signInUrl = new URL(
      buildSignInPath(
        nextPath,
        tokenExpired
          ? AUTH_REDIRECT_REASON.sessionExpired
          : AUTH_REDIRECT_REASON.authRequired,
      ),
      request.url,
    )
    const response = NextResponse.redirect(signInUrl)
    response.cookies.set(localeCookieName, locale)
    if (tokenExpired) {
      response.cookies.delete(AUTH_COOKIE_KEY)
    }
    return response
  }
  
  // 6. Se estiver logado e tentar ir para o login, manda pro dashboard
  if (pathname === '/sign-in' && token && !tokenExpired) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set(localeCookieName, locale)
    return response
  }

  if (pathname === '/sign-in' && tokenExpired) {
    const response = NextResponse.next()
    response.cookies.set(localeCookieName, locale)
    response.cookies.delete(AUTH_COOKIE_KEY)
    return response
  }

  const response = NextResponse.next()
  // Garantir que o cookie de locale esteja sempre presente
  response.cookies.set(localeCookieName, locale)
  return response
}

export const config = {
  matcher: [
    // Proteger tudo exceto API, estáticos, marca e ícones do navegador
    '/((?!api|_next/static|_next/image|brand|favicon.ico|icon.svg|icon).*)',
  ],
}
