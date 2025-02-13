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

  const response = await fetch("http://localhost:5000/api/auth/update-user", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
};

// Function to upload profile picture
export const uploadProfilePic = async (file: File, token: string) => {
  if (!supabase) throw new Error("Supabase is not initialized");

  try {
    const fileName = `${Date.now()}-${file.name}`;
    console.log("Uploading file to Supabase:", fileName); // Debugging

    // Upload the file to Supabase
    const { data, error } = await supabase.storage
      .from("profile-pictures") // Ensure the bucket name is correct
      .upload(fileName, file);

    if (error) {
      console.error("Supabase upload error:", error); // Debugging
      throw error;
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    if (!publicUrlData) {
      throw new Error("Failed to retrieve image URL");
    }

    console.log("Public URL:", publicUrlData.publicUrl); // Debugging
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("🔥 Upload failed:", error);
    throw error;
  }
};
