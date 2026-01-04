import { createClient } from '@supabase/supabase-js';

// CONFIGURATION -----------------------------------------------------------
// STEP 1: Go to Supabase > Project Settings > API
// STEP 2: Copy "Project URL" and paste it below.
export const SUPABASE_URL = 'https://tktwwtyrwgxbsrzgxtou.supabase.co'; 

// STEP 3: Copy "anon public" key and paste it below.
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdHd3dHlyd2d4YnNyemd4dG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTUyOTksImV4cCI6MjA4MzA3MTI5OX0.rMqNjcDguHa2SpLEPmHaBYKdw14_QIasJsXD_MyCU2A';
// -------------------------------------------------------------------------

// Create a single instance of the Supabase client
let supabaseInstance: any = null;

export const getSupabase = (url?: string, key?: string) => {
  if (supabaseInstance) return supabaseInstance;
  
  // Use provided args or fallback to hardcoded constants
  const targetUrl = url || SUPABASE_URL;
  const targetKey = key || SUPABASE_ANON_KEY;

  // validation to prevent crashing if keys are missing
  if (targetUrl && targetKey && targetUrl !== 'https://tktwwtyrwgxbsrzgxtou.supabase.co') {
    supabaseInstance = createClient(targetUrl, targetKey);
    return supabaseInstance;
  }
  
  return null;
};