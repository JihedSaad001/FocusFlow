import { createClient } from "@supabase/supabase-js";

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing required Supabase environment variables!");
  console.error(
    "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

