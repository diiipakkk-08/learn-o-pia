import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20);

if (typeof window !== 'undefined') {
  if (!isConfigured) {
    console.error(
      '🔴 [SUPABASE DISCONNECTED]: VITE_SUPABASE_ANON_KEY is missing or empty!\n' +
      '   ➜ Local: Add it to your .env file\n' +
      '   ➜ Vercel: Add it in Project Settings → Environment Variables → Redeploy\n' +
      '   ➜ Get your key from: https://supabase.com/dashboard/project/qwtjeusllzpuncvcmck/settings/api'
    );
  } else {
    console.log('⚡ [SUPABASE CONNECTED]: Live connection to', supabaseUrl);
  }
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;
