import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '⚠️ [SUPABASE DISCONNECTED]: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in your .env file! Database saving is currently using local fallback. Please add your Supabase Anon Key to your .env file.'
    );
  } else {
    console.log('⚡ [SUPABASE CONNECTED]: Connected live to Supabase project at', supabaseUrl);
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
