import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Supports both the new publishable key format (sb_publishable_...) and the legacy anon key
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for use in React components (browser)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// NOTA: el cliente admin (service_role) vive SOLO en el servidor.
// Ver src/lib/supabaseAdmin.server.ts y los API routes bajo src/app/api.
// Nunca lo importes desde un componente cliente.