// Server-side Supabase client with service role key for admin operations
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase-config'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY

// Use service role key for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, supabaseServiceKey)
