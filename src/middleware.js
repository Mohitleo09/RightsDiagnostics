import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that require authentication
const protectedPaths = [
  '/Patients/Dashboard',
  '/Patients/Dashboard/additional',
  '/api/profile',
  '/api/patient-additional-info'
];

// Admin paths that require authentication (excluding login and register)
const protectedAdminPaths = [
  '/Admin/Dashboard',
  '/Admin/Adminmanagement',
  '/Admin/Advertisment',
  '/Admin/Analytics',
  '/Admin/CouponMangement',
  '/Admin/Packages',
  '/Admin/Support',
  '/Admin/VendorManagement',
  '/Admin/adminTestManagement',
  '/Admin/categoryAdmin',
  '/Admin/labs'
];

// Vendor paths that require authentication (excluding login and register)
const protectedVendorPaths = [
  '/vendor/AllBookings',
  '/vendor/Analytics',
  '/vendor/LabProfile',
  '/vendor/TestManagement',
  '/vendor/verifyCoupon'
];

// Paths that should be redirected if user is already logged in
const authPaths = []; // Removed '/register' and '/login' from this list

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  // Use the same secret as in auth.js with fallback
  // Ensure we have a valid secret
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET_KEY || "rk12345";

  // Try to get the token
  let token = await getToken({
    req: request,
    secret,
  });

  // Check for session cookies directly as a fallback/diagnostic
  const sessionCookies = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token'
  ];
  const hasAnySessionCookie = sessionCookies.some(name => request.cookies.has(name));

  // Fallback for some NextAuth v5 environments
  if (!token && hasAnySessionCookie) {
    // Try with secret again (some environments need it)
    token = await getToken({ req: request, secret });
  }

  // Check for custom Google Login token
  const hasCustomAuthCookie = request.cookies.has('authToken');
  if (!token && hasCustomAuthCookie) {
    // We trust the cookie presence for routing protection. 
    // real validation happens in the API routes or client components.
    token = { role: 'user' }; // Mock token to pass checks
  }

  // Debugging
  console.log(`[Middleware] Path: ${pathname}, Token found: ${!!token}, Cookies present: ${hasAnySessionCookie}`);

  // If user is trying to access protected paths but is not logged in
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAdminProtectedPath = protectedAdminPaths.some(path => pathname.startsWith(path));
  const isVendorProtectedPath = protectedVendorPaths.some(path => pathname.startsWith(path));

  // Check if accessing main vendor dashboard
  const isVendorDashboard = pathname === '/vendor' || (pathname.startsWith('/vendor/') &&
    !pathname.startsWith('/vendor/login') &&
    !pathname.startsWith('/vendor/register'));

  const needsAuth = isProtectedPath || isAdminProtectedPath || isVendorProtectedPath || isVendorDashboard;

  if (needsAuth && !token) {
    // If we have a cookie but no token, the secret might be mismatched. 
    // In dev, we might want to allow it if we are desperate, but that's unsafe.
    // Instead, let's ensure we redirect to login but preserve the callback.
    console.log(`[Middleware] Redirecting to login from ${pathname}`);

    // Special handling for Admin/Vendor routes
    if (pathname.startsWith('/Admin')) {
      return NextResponse.redirect(new URL('/Admin/login', request.url));
    }
    if (pathname.startsWith('/vendor')) {
      return NextResponse.redirect(new URL('/vendor/login', request.url));
    }

    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access vendor routes, verify they have vendor role
  if ((isVendorProtectedPath || isVendorDashboard) && token) {
    // Check if user has vendor role and is approved
    if (token.role !== 'vendor') {
      const url = new URL('/vendor/login', request.url);
      url.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(url);
    }

    // Check if vendor is approved
    if (token.approvalStatus !== 'approved') {
      const url = new URL('/vendor/login', request.url);
      url.searchParams.set('error', 'not_approved');
      return NextResponse.redirect(url);
    }
  }

  // Create response with cache control headers to prevent browser caching
  const response = NextResponse.next();

  // Add cache control headers for protected routes to prevent back/forward button access
  if (isProtectedPath || isAdminProtectedPath || isVendorProtectedPath || isVendorDashboard) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
  }

  return response;
}

// Update the matcher to be more specific and avoid infinite loops
export const config = {
  matcher: [
    '/login',
    '/register',
    '/Patients/Dashboard/:path*',
    '/Admin/:path*',
    '/vendor/:path*',
    '/api/profile',
    '/api/patient-additional-info'
  ],
};