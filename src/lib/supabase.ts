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

// Device UUID for identifying this device (stored in localStorage)
const DEVICE_ID_KEY = 'fittracker_device_id';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};
