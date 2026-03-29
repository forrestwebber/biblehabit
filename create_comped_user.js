// create_comped_user.js
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Supabase URL or Service Role Key is not defined.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const email = 'forrest.webber.comped@slacked.co';
const password = 'CompedUser$lackedPROD_2026!';

async function createCompedUser() {
  console.log(`Attempting to create user: ${email}`);

  // 1. Clean Slate: Delete user if they already exist.
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
      console.error('Error listing users:', listError.message);
      return;
  }
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    console.log(`User ${email} already exists. Deleting for a clean slate.`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error('Error deleting existing user:', deleteError.message);
      return;
    }
    console.log('Existing user deleted.');
  }

  // 2. Create Auth User
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      image_analysis_preference: 'gemini_first',
      name: 'Forrest Webber (Comped)' // Correct metadata field
    },
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  if (!data.user) {
    console.log('User creation did not return a user object.');
    return;
  }
  
  console.log('✅ Auth user created successfully!');
  console.log(`User ID: ${data.user.id}`);

  // 3. Create Corresponding Profile with CORRECT schema
  console.log('Attempting to create profile entry...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([
      { 
        id: data.user.id, 
        email: data.user.email,
        name: 'Forrest Webber (Comped)', // Correct column
        stripe_customer_id: 'comped_acct_' + data.user.id,
        stripe_subscription_id: 'comped_sub_' + data.user.id,
        subscription_status: 'active', // Correct column
        // Set a future date for the subscription period end
        current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      }
    ]);

  if (profileError) {
    console.error('Error creating profile:', profileError.message);
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    console.log('Rolled back user creation due to profile insertion error.');
  } else {
    console.log('✅ Profile created and linked successfully.');
    console.log('Comped user setup is complete.');
  }
}

createCompedUser();
