import { createClient } from '@supabase/supabase-js';

// CONFIGURATION -----------------------------------------------------------
// STEP 1: Go to Supabase > Project Settings > API
// STEP 2: Copy "Project URL" and paste it below.
export const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_URL_HERE'; 

// STEP 3: Copy "anon public" key and paste it below.
export const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';
// -------------------------------------------------------------------------

// Create a single instance of the Supabase client
let supabaseInstance: any = null;

export const getSupabase = (url?: string, key?: string) => {
  if (supabaseInstance) return supabaseInstance;
  
  // Use provided args or fallback to hardcoded constants
  const targetUrl = url || SUPABASE_URL;
  const targetKey = key || SUPABASE_ANON_KEY;

  // validation to prevent crashing if keys are missing
  if (targetUrl && targetKey && targetUrl !== 'PASTE_YOUR_SUPABASE_URL_HERE') {
    supabaseInstance = createClient(targetUrl, targetKey);
    return supabaseInstance;
  }
  
  return null;
};
