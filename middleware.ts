import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login'];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Permitir rutas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // 2️⃣ Ignorar archivos estáticos y assets internos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts')
  ) {
    return NextResponse.next();
  }

  // 3️⃣ Verificar autenticación
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
