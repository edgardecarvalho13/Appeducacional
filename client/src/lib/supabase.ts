import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Hardcoded fallback values for production build on Vercel
// These are public keys (anon key) - safe to include in client-side code
const FALLBACK_URL = 'https://ugojtvlhpaiyygpqxroe.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnb2p0dmxocGFpeXlncHF4cm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTMwMDUsImV4cCI6MjA4OTg2OTAwNX0.7XhNeRGwsbKR1ENG3wGTtsKM_ppTqsbPXaWIam3YvWo';

function getEnvVar(key: string): string {
  try {
    // Vite replaces import.meta.env.VITE_XXX at build time
    const envVars: Record<string, string | undefined> = {
      'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
    const val = envVars[key];
    // Check if the value is a real URL/key or just the variable name (not replaced)
    if (val && val !== key && !val.startsWith('VITE_')) {
      return val;
    }
  } catch {
    // ignore
  }
  return '';
}

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || FALLBACK_URL;
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY') || FALLBACK_KEY;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
