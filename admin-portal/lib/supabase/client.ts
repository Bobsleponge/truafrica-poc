import { createBrowserClient } from '@supabase/ssr'

/**
 * Client-side Supabase client using anon key
 * Used for login and safe client-side operations
 * Never exposes service-role key
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for client')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}



