import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (singleton)
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;
  _client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

export const supabase = createClient();
