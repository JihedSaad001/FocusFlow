import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const defaultProfilePic =
  "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png"; // ✅ Default Profile Pic

const Navbar = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{
    username: string;
    profilePic?: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ Fetch user data from localStorage on page load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // ✅ Listen for localStorage updates (e.g., after profile update)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // ✅ Logout & clear user from localStorage
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/signin");
  };

  return (
    <nav className="bg-[#121212] px-8 py-4 flex justify-between items-center text-white shadow-md fixed top-0 left-0 w-full z-50">
      {/* Left: Logo */}
      <Link
        to="/"
        className="text-3xl font-extrabold bg-gradient-to-r from-[#ff4e50] to-[#fc913a] text-transparent bg-clip-text"
      >
        FocusFlow
      </Link>

      {/* Right: Navigation & Profile */}
      <div className="flex items-center space-x-6">
        {!user ? (
          <>
            <Link
              to="/signin"
              className="text-white text-lg hover:text-gray-300 transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 text-lg font-medium bg-gradient-to-r from-[#830E13] to-[#6B1E07] rounded-xl hover:opacity-90 transition-all duration-300 ease-out hover:scale-105"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img
                src={user.profilePic || defaultProfilePic}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-gray-500 shadow-md hover:scale-110 transition"
              />
              <span className="text-lg font-semibold">{user.username}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-lg">
                <button
                  className="block px-4 py-2 text-white hover:bg-gray-700 w-full text-left transition"
                  onClick={() => navigate("/profile")}
                >
                  Profile Settings
                </button>
                <button
                  className="block px-4 py-2 text-white hover:bg-gray-700 w-full text-left transition"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
