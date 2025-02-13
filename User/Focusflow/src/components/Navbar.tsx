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

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ✅ Listen for localStorage updates (e.g., after profile update)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
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

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Logout & clear user from localStorage
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/signin");
  };

  return (
    <nav className="bg-[#121212] p-4 flex justify-between items-center text-white">
      <Link to="/" className="text-2xl font-bold">
        MyApp
      </Link>

      <div className="relative" ref={dropdownRef}>
        {user ? (
          <div>
            <button
              className="flex items-center space-x-2 text-white"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img
                src={user.profilePic || defaultProfilePic}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-gray-500"
              />
              <span>{user.username}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-lg">
                <button
                  className="block px-4 py-2 text-white hover:bg-gray-700 w-full text-left"
                  onClick={() => navigate("/profile")}
                >
                  Profile Settings
                </button>
                <button
                  className="block px-4 py-2 text-white hover:bg-gray-700 w-full text-left"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/signin" className="text-white hover:text-gray-400">
              Sign In
            </Link>
            <Link to="/signup" className="text-white hover:text-gray-400">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
