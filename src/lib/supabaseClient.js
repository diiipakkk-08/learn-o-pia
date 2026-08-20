import { createClient } from '@supabase/supabase-js';

const getEnvStr = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.substring(1, str.length - 1);
  }
  return str.replace(/\/+$/, '');
};

const rawUrl = getEnvStr(import.meta.env.VITE_SUPABASE_URL);
const rawKey = getEnvStr(import.meta.env.VITE_SUPABASE_ANON_KEY);

let client = null;
// Must contain .supabase.co or at least start with http to be considered a remotely valid URL
const isConfigured = Boolean(rawUrl && rawKey && rawKey.length > 20 && (rawUrl.startsWith('http') || rawUrl.includes('.co')));

if (isConfigured) {
  try {
    const finalUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    
    // Validate it is a syntactically correct URL to prevent browser DNS redirect crashes
    new URL(finalUrl);

    client = createClient(finalUrl, rawKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    if (typeof window !== 'undefined') {
      console.log('⚡ [SUPABASE CONNECTED]: Live connection to', finalUrl);
    }
  } catch (err) {
    console.error('🔴 [SUPABASE INIT ERROR]: Could not initialize Supabase client. Your VITE_SUPABASE_URL might be invalid:', err);
    client = null;
  }
} else if (typeof window !== 'undefined') {
  console.warn(
    '⚠️ [SUPABASE DISCONNECTED]: Running in offline mode.\n' +
    '   ➜ Local: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env\n' +
    '   ➜ Vercel: Add them in Project Settings → Environment Variables → Redeploy\n' +
    '   ➜ CURRENT VITE_SUPABASE_URL is: ' + (rawUrl || 'MISSING')
  );
}

export const supabase = client;
