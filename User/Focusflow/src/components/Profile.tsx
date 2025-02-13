import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser, uploadProfilePic } from "../Api";
import { isTokenExpired } from "../utils/auth";

const defaultProfilePic =
  "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures/image_2025-02-08_215223222.png"; // ✅ Default Profile Pic

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    username: string;
    email: string;
    profilePic?: string;
  } | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState(""); // ✅ Require Old Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // ✅ Confirm New Password
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const token = localStorage.getItem("userToken");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      console.log("🔍 Profile Picture URL:", parsedUser.profilePic);
      setUser(parsedUser);
    } else {
      navigate("/signin");
    }
  }, [navigate, token]);

  const handleUpdate = async () => {
    if (!user || !token || isTokenExpired(token)) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("user");
      localStorage.removeItem("userToken");
      navigate("/signin");
      return;
    }

    // ✅ Ensure new password matches confirmation
    if (newPassword && newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    // ✅ Require old password when changing password
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

      // ✅ Send both old and new passwords when updating
      if (oldPassword.trim() && newPassword.trim()) {
        updatedData.oldPassword = oldPassword;
        updatedData.newPassword = newPassword;
      }

      const response = await updateUser(updatedData, token);

      if (response.success) {
        const updatedUser = { ...user, username: newUsername };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("Profile updated successfully!");
      } else {
        alert(
          response.message ||
            "Failed to update profile. Please check your old password."
        );
      }
    } catch (error) {
      console.error("🔥 Update Error:", error);
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

    setUploading(true);

    try {
      console.log("Uploading file:", file.name);

      const uploadedUrl = await uploadProfilePic(file, token);
      console.log("Profile Picture Uploaded:", uploadedUrl);

      await updateUser({ profilePic: uploadedUrl }, token);

      const updatedUser = { ...user, profilePic: uploadedUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile picture updated!");
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("🔥 Upload failed:", error);
      alert("Failed to upload profile picture.");
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
      <div className="bg-[#1E1E1E] p-8 rounded-lg shadow-lg w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-200">
          Profile Settings
        </h1>

        {/* Profile Picture Upload */}
        <div className="relative flex justify-center mb-6">
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files && handleFileUpload(e.target.files[0])
            }
          />
          <div className="relative group">
            <img
              src={user?.profilePic || defaultProfilePic}
              alt="Profile"
              className="w-28 h-28 rounded-full border-4 border-gray-600 shadow-lg transition-transform duration-300 hover:scale-110 cursor-pointer"
              onClick={handleImageClick}
            />
            {/* Upload Indicator */}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                <span className="text-white font-semibold text-sm animate-pulse">
                  Uploading...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Username Input */}
        <label className="block mb-2 text-left text-gray-400 font-semibold">
          Username:
        </label>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="w-full bg-black text-white p-3 rounded-lg shadow-md focus:ring-2 focus:ring-red-500 transition"
        />

        {/* Old Password Input */}
        <label className="block mt-4 mb-2 text-left text-gray-400 font-semibold">
          Old Password:
        </label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full bg-black text-white p-3 rounded-lg shadow-md focus:ring-2 focus:ring-red-500 transition"
        />

        {/* New Password Input */}
        <label className="block mt-4 mb-2 text-left text-gray-400 font-semibold">
          New Password:
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-black text-white p-3 rounded-lg shadow-md focus:ring-2 focus:ring-red-500 transition"
        />

        {/* Confirm New Password Input */}
        <label className="block mt-4 mb-2 text-left text-gray-400 font-semibold">
          Confirm New Password:
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-black text-white p-3 rounded-lg shadow-md focus:ring-2 focus:ring-red-500 transition"
        />

        {/* Buttons */}
        <div className="flex space-x-3 mt-6 justify-center">
          <button
            onClick={handleUpdate}
            className={`bg-red-500 px-5 py-2 rounded-lg text-white font-semibold shadow-lg transform transition-all hover:scale-105 hover:bg-red-600 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
