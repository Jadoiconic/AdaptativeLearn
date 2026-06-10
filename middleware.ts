import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth/signin') || 
                      req.nextUrl.pathname.startsWith('/auth/signup');
    
    // If user is authenticated and tries to access auth pages, redirect to dashboard
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // Allow access to protected routes if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access if token exists (user is authenticated)
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    // Protect all dashboard routes including nested routes
    '/dashboard/:path*',
    // Also protect auth pages to redirect authenticated users
    '/auth/signin/:path*',
    '/auth/signup/:path*',
  ],
};
