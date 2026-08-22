import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const authRoutes = ['/login'];
const dashboardRoutes = ['/events', '/registrations', '/tickets', '/checkin', '/hosts', '/users', '/payments', '/analytics', '/settings', '/audit-logs'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isLogin = authRoutes.includes(pathname);
  const isDashboard = pathname === '/' || dashboardRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isDashboard && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && user) {
    const { data: role } = await supabase.rpc('get_my_dashboard_role');
    if (role) return NextResponse.redirect(new URL('/', request.url));
  }

  if (isDashboard && user) {
    const { data: role, error } = await supabase.rpc('get_my_dashboard_role');
    if (error || !role) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
