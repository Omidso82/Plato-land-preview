import { createClient } from '@supabase/supabase-js';

// PLATO LAND live site uses the single main Supabase project.
// Keep browser credentials publishable only; never place a service_role key here.
const SUPABASE_URL = 'https://dfrppbapaaydbjeflozw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fuY9xR6e5pGB-6SnoV4-Hg_LNr23RzE';

export const supabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_');

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
