import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'İcazəsiz giriş' }, { status: 401 });
    }

    const body = await request.json();
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';

    if (!firstName || !lastName) {
      return NextResponse.json({ exists: false });
    }

    // Əgər service role key konfiqurasiya olunubsa, bütün məktəb üzrə students cədvəlini yoxlayırıq
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      const { data: existingStudents } = await admin
        .from('students')
        .select('id, is_archived')
        .ilike('first_name', firstName)
        .ilike('last_name', lastName);

      const hasActiveStudent = (existingStudents || []).some((s) => s.is_archived !== true);
      if (hasActiveStudent) {
        return NextResponse.json({ exists: true });
      }
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error('check-duplicate error:', err);
    return NextResponse.json({ exists: false });
  }
}
