import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using service-role key
 * Bypasses RLS and has full database access
 * WARNING: Only use in server components, route handlers, and server actions
 * NEVER expose this to the browser
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for server client')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}



