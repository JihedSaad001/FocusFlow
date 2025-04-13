import { supabase } from "./config/supabase";
import { jwtDecode } from "jwt-decode";

// Interface for decoding JWT tokens
interface DecodedToken {
  id: string;
  exp: number;
}

// Function to check if a token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.exp < Date.now() / 1000; // Compare with current time
  } catch {
    return true; // Assume expired if decoding fails
  }
};

// Function to update user details (username, password, profilePic)
export const updateUser = async (data: any, token: string) => {
  if (isTokenExpired(token)) {
    localStorage.clear();
    window.location.href = "/signin"; // Redirect to login
    throw new Error("Session expired. Please log in again.");
  }

  const response = await fetch(
    "https://focusflow-production.up.railway.app/api/auth/update-user",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
};

// Function to upload profile picture
export const uploadProfilePic = async (file: File, token: string) => {
  if (!supabase) throw new Error("Supabase is not initialized");

  try {
    const fileExt = file.name.split(".").pop(); // Extract file extension
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    console.log(`📤 Uploading file: ${fileName} with token: ${token}`);

    // ✅ Store token for debugging
    localStorage.setItem("lastUploadToken", token);

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("🔥 Supabase upload error:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Upload failed - no data returned");
    }

    // ✅ Correctly getting public URL (Fix for TS2339)
    const { data: publicUrlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to retrieve image URL");
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log("✅ Upload successful! Public URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("🔥 Upload failed:", error);
    throw error;
  }
};

// New function to fetch user productivity stats
export const fetchUserStats = async (token: string, timeRange = "week") => {
  if (isTokenExpired(token)) {
    localStorage.clear();
    window.location.href = "/signin"; // Redirect to login
    throw new Error("Session expired. Please log in again.");
  }

  try {
    const response = await fetch(
      `https://focusflow-production.up.railway.app/api/user/stats?timeRange=${timeRange}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

// New function to log a focus session
export const logFocusSession = async (
  token: string,
  sessionData: {
    duration: number;
    completed: boolean;
    ambientSound?: string;
  }
) => {
  if (isTokenExpired(token)) {
    localStorage.clear();
    window.location.href = "/signin";
    throw new Error("Session expired. Please log in again.");
  }

  try {
    const response = await fetch(
      "https://focusflow-production.up.railway.app/api/user/log-focus-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to log focus session");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging focus session:", error);
    throw error;
  }
};

// New function to log completed task
export const logCompletedTask = async (token: string, taskId: string) => {
  if (isTokenExpired(token)) {
    localStorage.clear();
    window.location.href = "/signin";
    throw new Error("Session expired. Please log in again.");
  }

  try {
    const response = await fetch(
      "https://focusflow-production.up.railway.app/api/user/log-completed-task",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to log completed task");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging completed task:", error);
    throw error;
  }
};
