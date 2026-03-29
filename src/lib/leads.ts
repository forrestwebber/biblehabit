import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase credentials not configured (SUPABASE_URL / SUPABASE_ANON_KEY)');
  }
  _client = createClient(url, key);
  return _client;
}

export async function createLead(lead: { name: string; email: string; event_time: string }) {
  const supabase = getClient();
  const { data, error } = await supabase.from('leads').insert([lead]);
  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
  return data;
}
