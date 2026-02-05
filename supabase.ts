
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase environment variables! Check your .env file.', {
    url: supabaseUrl,
    key: supabaseAnonKey ? 'Found' : 'Missing'
  });
  // We still throw because the client cannot be created without them, 
  // but now we have a console log.
  throw new Error('Missing Supabase environment variables - Check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
