const { createClient } = require("@supabase/supabase-js");


const SUPABASE_URL = "https://qhedchvmvmuflflstcwx.supabase.co"; 
const SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZWRjaHZtdm11ZmxmbHN0Y3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ0MzA5MSwiZXhwIjoyMDU0MDE5MDkxfQ.FAPYLJghQ-XrbTLZy9F0vBvDKfmSl1qFVbMS7F048ws"
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);


module.exports = { supabase };
