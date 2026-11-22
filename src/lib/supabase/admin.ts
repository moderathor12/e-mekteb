import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Bu müştəri yalnız server tərəfdə və təhlükəsiz şəkildə istifadə olunur (məsələn, admin qeydiyyatı və ya sistem təsdiqləmələri)
// Heç bir halda brauzer koduna ötürülməməlidir!
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL və ya Service Role Key təyin edilməyib.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
