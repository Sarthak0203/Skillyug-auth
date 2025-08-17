import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' 
  }
})

export interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type: 'student' | 'instructor' | 'admin'
  avatar_url?: string
  created_at: string
  updated_at: string
  email_verified: boolean
  last_sign_in_at?: string
}

export interface AuthError {
  message: string
  code?: string
}
