import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
  },
})

let pendingSession: ReturnType<typeof createAnonymousSession> | null = null

async function createAnonymousSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const { data: created, error } = await supabase.auth.signInAnonymously()
  if (error || !created.session) throw new Error(error?.message ?? 'เริ่มต้นบัญชีผู้ใช้ไม่สำเร็จ')
  return created.session
}

export function ensureSession() {
  if (!pendingSession) {
    pendingSession = createAnonymousSession().finally(() => { pendingSession = null })
  }
  return pendingSession
}
