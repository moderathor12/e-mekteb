import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Əgər Supabase konfiqurasiyası hələ daxil edilməyibsə, xəta vermədən növbəti səhifəyə keç
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as any)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Qorunan marşrutlar
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password');
  const isAdminRoute = path.startsWith('/admin');
  const isTeacherRoute = path.startsWith('/teacher');
  const isParentRoute = path.startsWith('/parent');
  const isProtectedRoute = isAdminRoute || isTeacherRoute || isParentRoute;

  // Əgər istifadəçi daxil olmayıbsa və qorunan səhifəyə daxil olmaq istəyirsə
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // İstifadəçi daxil olubsa, profilini və rolunu yoxla
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const isActive = profile?.is_active ?? true;

    if (!isActive && path !== '/pending-approval') {
      const url = request.nextUrl.clone();
      url.pathname = '/pending-approval';
      return NextResponse.redirect(url);
    }

    // Əgər auth səhifələrinə (login/register) daxil olursa, öz panelinə yönləndir
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      if (role === 'admin') url.pathname = '/admin';
      else if (role === 'teacher') url.pathname = '/teacher';
      else url.pathname = '/parent';
      return NextResponse.redirect(url);
    }

    // Rol əsaslı təhlükəsizlik yoxlanışları
    if (isAdminRoute && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    if (isTeacherRoute && role !== 'teacher' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    if (isParentRoute && role !== 'parent' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
