import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Pastikan token tersedia
    const token = req.nextauth.token as { role?: string } | null;

    const role = token?.role;

    console.log('Role:', role);

    if (pathname === '/') {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      } else if (role === 'user') {
        return NextResponse.redirect(new URL('/user', req.url));
      }
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (pathname.startsWith('/user') && role !== 'user') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: ['/', '/admin/', '/user/']
};


