import { createClient } from '@supabase/supabase-js';

// Sanitize input values by removing whitespace, quotes, or trailing slashes
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

let client = null;
const isConfigured = Boolean(rawUrl && rawKey && rawKey.length > 20 && rawUrl.startsWith('http'));

if (isConfigured) {
  try {
    client = createClient(rawUrl, rawKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    if (typeof window !== 'undefined') {
      console.log('⚡ [SUPABASE CONNECTED]: Live connection to', rawUrl);
    }
  } catch (err) {
    console.error('🔴 [SUPABASE INIT ERROR]: Could not initialize Supabase client:', err);
    client = null;
  }
} else if (typeof window !== 'undefined') {
  console.warn(
    '⚠️ [SUPABASE DISCONNECTED]: Running in offline mode.\n' +
    '   ➜ Local: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env\n' +
    '   ➜ Vercel: Add them in Project Settings → Environment Variables → Redeploy'
  );
}

export const supabase = client;
