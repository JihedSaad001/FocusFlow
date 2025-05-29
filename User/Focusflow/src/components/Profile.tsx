import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, User, ArrowLeft } from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Interface for decoded token
interface DecodedToken {
  id: string;
  exp: number;
}

// Function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token);

    console.log(
      `🔍 Token Debug: ID: ${decoded.id}, Exp: ${
        decoded.exp
      }, Current Time: ${Math.floor(Date.now() / 1000)}`
    ); // ✅ Logs token details

    // ✅ Store token expiration info in localStorage for debugging
    localStorage.setItem("lastCheckedToken", JSON.stringify(decoded));

    return decoded.exp < Date.now() / 1000; // Compare with current time
  } catch (error) {
    console.error("⚠️ Token decoding failed, assuming expired:", error);
    return true; // Assume expired if decoding fails
  }
};

const defaultProfilePic =
  "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures/default-avatar.png";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    username: string;
    email: string;
    profilePic?: string;
  } | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token"); // ✅ Fix case sensitivity

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser); //parse makes json an object
      setUser(parsedUser);
      setNewUsername(parsedUser.username);
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  const handleUpdate = async () => {
    if (!user || !token || isTokenExpired(token)) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/signin");
      return;
    }

    // Validate username length if it's being changed
    if (
      newUsername.trim() &&
      newUsername !== user.username &&
      newUsername.length < 3
    ) {
      alert("Username must be at least 3 characters long");
      return;
    }

    // Validate password length if it's being changed
    if (newPassword && newPassword.length < 5) {
      alert("Password must be at least 5 characters long");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (newPassword && !oldPassword) {
      alert("Please enter your old password to confirm changes.");
      return;
    }

    setLoading(true);
    try {
      const updatedData: {
        username?: string;
        oldPassword?: string;
        newPassword?: string;
      } = {};

      if (newUsername.trim() && newUsername !== user.username) {
        updatedData.username = newUsername;
      }

      if (oldPassword.trim() && newPassword.trim()) {
        updatedData.oldPassword = oldPassword;
        updatedData.newPassword = newPassword;
      }

      // Create axios instance with default config
      const api = axios.create({
        baseURL: "https://focusflow-production.up.railway.app/api",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await api.put("/auth/update-user", updatedData);

      if (response.data.success) {
        const updatedUser = { ...user, username: newUsername };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Show a simple alert for success message
        alert("Profile updated successfully!");

        // Clear password fields after successful update
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(
          response.data.message ||
            "Failed to update profile. Please check your old password."
        );
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user || !token) {
      console.error("File, user, or token is missing");
      return;
    }

    // Validate file type
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      alert(`Invalid file format. Please upload a valid image (JPEG, PNG, GIF, or WebP).
Uploaded file type: ${file.type}`);
      return;
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      alert(
        `Invalid file extension. Please upload a file with one of these extensions: ${validExtensions.join(
          ", "
        )}`
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Create axios instance with default config
      const api = axios.create({
        baseURL: "https://focusflow-production.up.railway.app/api",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload profile picture
      const response = await api.post("/auth/upload-profile-pic", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Extract the profile picture URL from the response
      const profilePicUrl = response.data.profilePic;

      // Update local state and localStorage with new profile picture
      const updatedUser = { ...user, profilePic: profilePicUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Show a simple alert for success message
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = () => {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white px-6">
      <div className="bg-[#1E1E1E] p-12 rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
            Profile Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your account preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col items-center space-y-8">
            <div className="relative">
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && handleFileUpload(e.target.files[0])
                }
              />
              <div
                className="relative group cursor-pointer w-40 h-40"
                onClick={handleImageClick}
              >
                <img
                  src={user?.profilePic || defaultProfilePic}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-red-500/30 shadow-lg transition-all duration-300 group-hover:border-red-500"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                  <Camera
                    className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                    size={32}
                  />
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      <span className="text-white text-sm mt-2">
                        Uploading...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full space-y-2">
              <label className="flex items-center text-gray-300 font-medium">
                <User size={18} className="mr-2" />
                Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                placeholder="Enter new username"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-300 mb-6">
              Change Password
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-400">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-400">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/50 text-white p-3 rounded-lg border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-4 rounded-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-red-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
