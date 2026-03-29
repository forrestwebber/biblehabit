const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Supabase URL or Anon Key is not defined.");
  console.error("Please check your .env.local file in the slacked-co project directory.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'forrest.webber.comped@slacked.co';
const password = process.env.COMPED_USER_PASSWORD;

if (!password) {
    console.error("Error: COMPED_USER_PASSWORD environment variable not set.");
    console.log("This script requires the password to verify the user account.");
    process.exit(1);
}

async function verifyUser() {
  console.log(`Attempting to sign in as ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Sign-in failed:');
    console.error(error);
    return;
  }

  if (data.user) {
    console.log('✅ Verification successful!');
    console.log(`User ID: ${data.user.id}`);
    console.log(`User Email: ${data.user.email}`);
    console.log("This confirms the comped user account was created successfully in Supabase.");
    await supabase.auth.signOut();
    console.log("Signed out successfully.");
  } else {
    console.log('Sign-in attempt did not return a user object, but no error was thrown.');
  }
}

verifyUser();
