import { createClient } from '@supabase/supabase-js';

// These environment variables need to be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Generate a unique client ID for this browser tab
const clientId = typeof window !== 'undefined' ? `tab-${Math.random().toString(36).substring(2, 10)}` : 'server';

// Create a single supabase client for the entire app with realtime enabled
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: true, 
    autoRefreshToken: true
  },
  global: {
    headers: {
      'X-Client-Info': clientId
    }
  }
}); 