import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

let cachedProfile: Profile | null = null;
let profilePromise: Promise<Profile | null> | null = null;

export async function getCachedProfile(): Promise<Profile | null> {
  if (cachedProfile) return cachedProfile;

  // Brauzer yaddaşında (sessionStorage) varsa dərhal qaytar
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('cached_profile');
    if (stored) {
      try {
        cachedProfile = JSON.parse(stored);
        return cachedProfile;
      } catch {
        // parsing error
      }
    }
  }

  // Əgər artıq sorğu gedirsə təkrar göndərmə
  if (profilePromise) return profilePromise;

  profilePromise = (async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      cachedProfile = prof;
      if (typeof window !== 'undefined' && prof) {
        sessionStorage.setItem('cached_profile', JSON.stringify(prof));
        document.cookie = `app_user_role=${prof.role}; path=/; max-age=604800; SameSite=Lax`;
      }
      return prof;
    } catch (err) {
      console.error('Failed to get user profile:', err);
      return null;
    } finally {
      profilePromise = null;
    }
  })();

  return profilePromise;
}

export function setCachedProfile(profile: Profile): void {
  cachedProfile = profile;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('cached_profile', JSON.stringify(profile));
    document.cookie = `app_user_role=${profile.role}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function clearProfileCache(): void {
  cachedProfile = null;
  profilePromise = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('cached_profile');
    document.cookie = 'app_user_role=; path=/; max-age=0; SameSite=Lax';
  }
}
