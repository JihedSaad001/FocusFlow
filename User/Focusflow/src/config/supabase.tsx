import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qhedchvmvmuflflstcwx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZWRjaHZtdm11ZmxmbHN0Y3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ0MzA5MSwiZXhwIjoyMDU0MDE5MDkxfQ.FAPYLJghQ-XrbTLZy9F0vBvDKfmSl1qFVbMS7F048ws";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
