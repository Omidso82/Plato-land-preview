import { createClient } from '@supabase/supabase-js';

// PLATO LAND Preview is intentionally isolated from Production.
// This branch uses only the dedicated Staging Supabase project.
// Browser-safe publishable key only; never place a service_role key here.
const SUPABASE_URL = 'https://vgezfuztgzxbmvkmaoqn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RFIjvnuyKTODRMCud21nvQ_4IM8wm4c';

export const supabaseConfigured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_');

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
