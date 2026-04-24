import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * PHASE 1: Server-side route protection proxy
 * 
 * Enforces role-based access control BEFORE pages load, preventing:
 * - Flash of unauthorized content
 * - SEO indexing of protected routes
 * - Client-side bypass attempts
 * 
 * Note: Next.js 15+ uses "proxy.ts" instead of "middleware.ts"
 */

// Define protected routes and their required roles
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/users': ['president', 'vp', 'secretary', 'lead'],
  '/workspace': ['president', 'vp', 'secretary', 'lead', 'member'],
  '/analytics': ['president', 'vp', 'secretary', 'lead', 'member'],
  '/settings': ['president', 'vp', 'secretary', 'lead', 'member'],
  '/dashboard': ['president', 'vp', 'secretary', 'lead', 'member'],
  '/board': ['president', 'vp', 'secretary', 'lead', 'member'],
  '/pending-approval': [], // Special case: handled separately
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    return NextResponse.next({ request });
  }

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables not configured');
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Check if user has an active session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      // No session - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Fetch user profile to check role and approval status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      // User profile not found - redirect to login
      console.error('User profile fetch error:', userError);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Approval Status Check
    // ═══════════════════════════════════════════════════════════
    
    if (!user.is_approved) {
      // Unapproved users can only access pending-approval page
      if (pathname !== '/pending-approval') {
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }
      return supabaseResponse;
    }

    // Approved users should not see pending-approval page
    if (pathname === '/pending-approval') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Role-Based Access Control (RBAC)
    // ═══════════════════════════════════════════════════════════
    
    for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          // User doesn't have permission - redirect to dashboard
          const response = NextResponse.redirect(new URL('/dashboard', request.url));
          
          // Set a header to inform the client why they were redirected
          response.headers.set('X-Redirect-Reason', 'insufficient-permissions');
          
          return response;
        }
        break;
      }
    }

    // User has permission - allow access
    return supabaseResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure which routes this proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
