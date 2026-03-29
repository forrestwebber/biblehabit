// get_schema.js
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Supabase URL or Service Role Key is not defined.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getSchema() {
  console.log('Fetching schema for "profiles" table...');
  
  // This is a way to introspect the schema by selecting a single row
  // and observing its keys. Supabase JS client doesn't have a dedicated
  // schema-fetching method, but this is a reliable workaround.
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore error for empty table
    console.error('Error fetching schema:', error.message);
    return;
  }

  if (data) {
    console.log('✅ Schema retrieved successfully. Columns are:');
    console.log(Object.keys(data).join(', '));
  } else {
    console.log('Table appears to be empty, but a direct query can still be constructed. This is less reliable.');
    // In a truly empty table, you'd have to rely on dashboard inspection.
    // For this case, we assume there's at least one profile to introspect.
  }
}

getSchema();
