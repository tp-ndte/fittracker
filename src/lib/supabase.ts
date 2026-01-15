import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for production
console.log('[Supabase] Initializing...');
console.log('[Supabase] URL defined:', !!supabaseUrl);
console.log('[Supabase] Key defined:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  throw new Error('Missing Supabase environment variables. Check Vercel environment settings.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
console.log('[Supabase] Client created successfully');

// Fixed user ID for this personal app
// Using a constant ensures consistency between Safari browser and PWA home screen
const DEFAULT_USER_ID = 'default-user';

export const getDeviceId = (): string => {
  console.log('[FitTracker] Using user ID:', DEFAULT_USER_ID);
  console.log('[FitTracker] App context:', window.matchMedia('(display-mode: standalone)').matches ? 'PWA' : 'Browser');
  return DEFAULT_USER_ID;
};
