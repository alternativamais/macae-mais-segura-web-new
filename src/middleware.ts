import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales, localeCookieName } from './lib/i18n/config'

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
  const token = request.cookies.get('@alternativa-base:token')?.value

  // 4. Redirecionar rotas antigas para a nova
  if (pathname === '/login' || pathname.startsWith('/auth/sign-in') || pathname === '/sign-in-3') {
    const response = NextResponse.redirect(new URL('/sign-in', request.url))
    response.cookies.set(localeCookieName, locale)
    return response
  }

  // 5. Bloquear acesso a rotas privadas se não houver token
  if (!isPublicRoute && !token) {
    const unauthorizedUrl = new URL('/unauthorized', request.url)
    unauthorizedUrl.searchParams.set('next', pathname)
    const response = NextResponse.redirect(unauthorizedUrl)
    response.cookies.set(localeCookieName, locale)
    return response
  }
  
  // 6. Se estiver logado e tentar ir para o login, manda pro dashboard
  if (isPublicRoute && token && pathname === '/sign-in') {
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set(localeCookieName, locale)
    return response
  }

  const response = NextResponse.next()
  // Garantir que o cookie de locale esteja sempre presente
  response.cookies.set(localeCookieName, locale)
  return response
}

export const config = {
  matcher: [
    // Proteger tudo exceto API, estáticos e favicon
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
