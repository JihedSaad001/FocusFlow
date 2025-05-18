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
export const fetchWallpapers = async () => {
  // 🔹 Fetch files from the "wallpapers" bucket
  const { data, error } = await supabase.storage.from("wallpapers").list();

  if (error) {
    console.error("❌ Error fetching wallpapers:", error.message);
    return [];
  }

  // 🔹 Generate public URLs for each wallpaper using Supabase's getPublicUrl method
  return data.map((file) => {
    const { data: publicUrlData } = supabase.storage
      .from("wallpapers")
      .getPublicUrl(file.name);

    return {
      name: file.name,
      url: publicUrlData?.publicUrl || "",
    };
  });
};
