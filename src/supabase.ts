import { createClient } from '@supabase/supabase-js';

// Set these to the Project URL and publishable/anon key from your own Supabase project.
// Never put the service_role key in browser code.
const SUPABASE_URL = 'https://YOUR-PREVIEW-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_PREVIEW_PUBLISHABLE_KEY_HERE';

export const supabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('PASTE_') &&
  !SUPABASE_ANON_KEY.includes('PASTE_') &&
  SUPABASE_ANON_KEY.length > 20;

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
