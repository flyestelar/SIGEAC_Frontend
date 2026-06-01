import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login'];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    // Permitir rutas públicas
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/acceso_publico') ||
    // Ignorar archivos estáticos y assets internos
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts')
  ) {
    return NextResponse.next();
  }

  // Verificar autenticación
  const authToken = req.cookies.get('auth_token')?.value;

  if (!authToken) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
