import 'server-only'
import { createClient } from '@supabase/supabase-js'

let supabaseAdmin: ReturnType<typeof createClient> | undefined

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase Storage is not configured')
  }

  supabaseAdmin ??= createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdmin
}
