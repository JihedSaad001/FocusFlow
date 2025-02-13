import { useNavigate, useLocation } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="flex justify-between items-center px-6 md:px-10 py-4 bg-[#121212] shadow-lg border-b border-[#6E1818] fixed top-0 left-0 w-full z-50">
      {/* Left: Profile Image */}
      <img
        src="/src/assets/cat.png"
        alt="Logo"
        className="w-16 h-16 object-contain"
      />

      {/* Middle: Navigation Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className={`px-6 py-2 rounded-2xl font-semibold shadow-xl ${
            isActive("/admin/dashboard")
              ? "bg-[#0F0D0D] border border-[#6E1818] text-white"
              : "bg-transparent text-white hover:bg-gray-800"
          }`}
        >
          Users Management
        </button>
        <button
          onClick={() => navigate("/admin/dashboards")}
          className={`px-6 py-2 rounded-2xl font-semibold shadow-xl ${
            isActive("/admin/dashboards")
              ? "bg-[#0F0D0D] border border-[#6E1818] text-white"
              : "bg-transparent text-white hover:bg-gray-800"
          }`}
        >
          Dashboards
        </button>
        <button
          onClick={() => navigate("/admin/resources")}
          className={`px-6 py-2 rounded-2xl font-semibold shadow-xl ${
            isActive("/admin/resources")
              ? "bg-[#0F0D0D] border border-[#6E1818] text-white"
              : "bg-transparent text-white hover:bg-gray-800"
          }`}
        >
          Resources Database
        </button>
      </div>

      {/* Right: Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-gradient-to-r from-[#830E13] to-[#6B1E07] text-white px-6 py-2 rounded-2xl shadow-xl hover:scale-105 transition"
      >
        Logout
      </button>
    </div>
  );
};

export default NavBar;
