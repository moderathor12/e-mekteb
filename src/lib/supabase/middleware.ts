import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;

  // Next.js prefetch sorğularını dərhal buraxırıq (artıq şəbəkə gecikməsinin qarşısını almaq üçün)
  const isPrefetch =
    request.headers.get('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch');

  if (isPrefetch) {
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

  // Marşrut kateqoriyaları
  const isAuthRoute =
    path === '/login' ||
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path === '/teacher/login' ||
    path === '/admin/login';

  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';
  const isTeacherRoute = path.startsWith('/teacher') && path !== '/teacher/login';
  const isParentRoute = path.startsWith('/parent');
  const isProtectedRoute = isAdminRoute || isTeacherRoute || isParentRoute;

  // Əgər qorunan marşrut və ya auth səhifəsi deyilsə (məsələn: əsas səhifə `/`), dərhal davam et
  if (!isProtectedRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // İstifadəçi daxil olmayıbsa və qorunan səhifəyə daxil olmaq istəyirsə
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    if (isAdminRoute) {
      url.pathname = '/admin/login';
    } else if (isTeacherRoute) {
      url.pathname = '/teacher/login';
    } else {
      url.pathname = '/login';
    }
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // İstifadəçi daxil olubsa rolunu müəyyən edirik
  if (user) {
    // Əvvəlcə sürətli cookie keşindən oxuyuruq (0ms)
    let role = request.cookies.get('app_user_role')?.value;

    if (!role) {
      // Yoxdursa bazadan bir dəfə oxuyub cookie-yə yazırıq
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      const resolvedRole: string = profile?.role || 'parent';
      role = resolvedRole;
      const isActive = profile?.is_active ?? true;

      if (!isActive && path !== '/pending-approval') {
        const url = request.nextUrl.clone();
        url.pathname = '/pending-approval';
        return NextResponse.redirect(url);
      }

      supabaseResponse.cookies.set('app_user_role', resolvedRole, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    }

    // Əgər auth səhifələrinə daxil olursa, öz panelinə yönləndir
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
