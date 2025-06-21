import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/create-invite') ||
    pathname.startsWith('/invite')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(`${pathname}${search}`);
    const inviteCode = request.nextUrl.searchParams.get('invite');

    if (inviteCode) {
      // 如果有邀请码，直接传递给guest认证
      return NextResponse.redirect(
        new URL(
          `/api/auth/guest?redirectUrl=${redirectUrl}&invite=${inviteCode}`,
          request.url,
        ),
      );
    } else {
      // 没有邀请码，重定向到邀请码输入页面
      return NextResponse.redirect(
        new URL(`/invite?redirectUrl=${redirectUrl}`, request.url),
      );
    }
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
