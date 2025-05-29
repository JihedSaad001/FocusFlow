const { createClient } = require("@supabase/supabase-js");

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Missing required Supabase environment variables!");
  console.error("Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE are set in your .env file");
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase };
