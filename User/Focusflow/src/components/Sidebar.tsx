import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Menu,
  LibraryBig,
  Kanban,
  FolderKanban,
  FolderPlus,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    navigate("/signin");
  };

  return (
    <div
      className={`h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-white flex flex-col fixed z-100 left-0 top-0 border-r border-white/[0.08] transition-all duration-300 ${
        isExpanded ? "w-64" : "w-20"
      }`}
      onMouseEnter={() => {
        if (timeoutId) clearTimeout(timeoutId); // Clear any previous timeout
        setIsExpanded(true);
      }}
      onMouseLeave={() => {
        const id = setTimeout(() => {
          setIsExpanded(false);
        }, 200);
        setTimeoutId(id);
      }}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center space-x-3">
        <Menu className="w-8 h-8 text-white cursor-pointer" />
        {isExpanded && (
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff4e50] to-[#fc913a] bg-clip-text text-transparent transition-opacity duration-300">
            FocusFlow
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          <Link
            to="/home"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <Home className="w-5 h-5 text-gray-400 group-hover:text-[#ff4e50] transition-colors" />
            {isExpanded && <span className="ml-3 opacity-100">Home</span>}
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-[#ff4e50] transition-colors" />
            {isExpanded && <span className="ml-3 opacity-100">Dashboard</span>}
          </Link>

          <Link
            to="/workspace"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <LibraryBig className="w-5 h-5 text-gray-400 group-hover:text-[#ff4e50] transition-colors" />
            {isExpanded && <span className="ml-3 opacity-100">Workspace</span>}
          </Link>

          <Link
            to="/kanban"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <Kanban className="w-5 h-5 text-gray-400 group-hover:text-[#ff4e50] transition-colors" />
            {isExpanded && <span className="ml-3 opacity-100">Kanban</span>}
          </Link>
          <Link
            to="/projects"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <FolderKanban className="w-5 h-5 text-gray-400 group-hover:text-[#ff4e50] transition-colors" />
            {isExpanded && <span className="ml-3 opacity-100">Projects</span>}
          </Link>
          <Link
            to="/createProject"
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <FolderPlus className="w-5 h-5 text-gray-400 group-hover:text-[#ff4e50] transition-colors" />
            {isExpanded && (
              <span className="ml-3 opacity-100">Create Project</span>
            )}
          </Link>
        </div>
      </nav>

      {/* Profile Section */}
      <div className="relative px-3 pb-5">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center w-full p-3 text-sm rounded-lg transition-all duration-200 hover:bg-white/[0.08] active:bg-white/[0.12]"
          >
            <img
              src={
                user?.profilePic ||
                "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png"
              }
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-white/[0.08]"
            />
            {isExpanded && (
              <>
                <span className="ml-3 flex-1 text-left font-medium opacity-100">
                  {user?.username || "User"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && isExpanded && (
            <div className="absolute bottom-full left-0 w-full p-1.5 mb-1">
              <div className="bg-[#1a1a1a] rounded-lg border border-white/[0.08] shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setDropdownOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.08] transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.08] transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
                <button></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
