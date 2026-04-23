import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Ignore API or missing env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPaths = ['/dashboard', '/board', '/workspace', '/users', '/analytics', '/settings'];
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect auth paths if authenticated
  if (user && (path === '/login' || path === '/signup' || path === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && (isProtectedPath || path === '/pending-approval')) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (token) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';
        const res = await fetch(`${apiUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const profile = await res.json();
          
          if (!profile.is_approved && path !== '/pending-approval') {
            return NextResponse.redirect(new URL('/pending-approval', request.url));
          }
          
          if (profile.is_approved) {
            // If they are approved, they shouldn't be on the pending page
            if (path === '/pending-approval') {
              return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            
            // Member protection
            if (profile.role === 'member') {
              if (path.startsWith('/workspace') || path.startsWith('/users')) {
                return NextResponse.redirect(new URL('/board', request.url));
              }
            }
            
            // Exec/Lead protection for /users
            if (['lead', 'vp', 'secretary'].includes(profile.role)) {
              if (path.startsWith('/users') && profile.role === 'lead') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
              }
            }
          }
        }
      } catch (e) {
        console.error("Middleware profile fetch error:", e);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
