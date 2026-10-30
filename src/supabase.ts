import { createClient } from '@supabase/supabase-js';

// Preview uses its own Supabase project. Never use the production project's
// credentials here, and never expose a service_role/secret key in browser code.
const SUPABASE_URL = 'https://vgezfuztgzxbmvkmaoqn.supabase.co';
const env = (import.meta as any).env || {};
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.toLowerCase().includes('service_role');

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
