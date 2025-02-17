import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qhedchvmvmuflflstcwx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZWRjaHZtdm11ZmxmbHN0Y3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ0MzA5MSwiZXhwIjoyMDU0MDE5MDkxfQ.FAPYLJghQ-XrbTLZy9F0vBvDKfmSl1qFVbMS7F048ws";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const fetchWallpapers = async () => {
  // 🔹 Fetch files from the "wallpapers" bucket
  const { data, error } = await supabase.storage.from("wallpapers").list();

  if (error) {
    console.error("❌ Error fetching wallpapers:", error.message);
    return [];
  }

  // 🔹 Generate public URLs for each wallpaper
  return data.map((file) => ({
    name: file.name,
    url: `${supabaseUrl}/storage/v1/object/public/wallpapers/${file.name}`,
  }));
};
