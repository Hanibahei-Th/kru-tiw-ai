import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Anonymous app: no Supabase auth session is used, so the client stays stateless.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})
