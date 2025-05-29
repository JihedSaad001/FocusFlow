import { useEffect, useState } from "react";
import {
  fetchUsers,
  updateUserRole,
  fetchUserStats,
  fetchProjectStats,
} from "../api";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import {
  FaEllipsisV,
  FaCrown,
  FaUserClock,
  FaProjectDiagram,
  FaChartLine,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  tasksCompleted: number;
  xp: number;
  level: number;
  lastActive: string;
  projectCount: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalFocusTime: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalFocusTime: 0,
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const loadData = async () => {
      try {
        // Fetch users
        const userData = await fetchUsers(token);
        if (Array.isArray(userData)) {
          setUsers(userData);
        } else if (userData && Array.isArray(userData.users)) {
          setUsers(userData.users);
        } else {
          setError("Invalid API response.");
          setUsers([]);
        }

        // Fetch user statistics
        const userStats = await fetchUserStats(token);

        // Fetch project statistics
        const projectStats = await fetchProjectStats(token);

        setStats({
          totalUsers: userStats.totalUsers || 0,
          activeUsers: userStats.activeUsers || 0,
          totalProjects: projectStats.totalProjects || 0,
          totalFocusTime: userStats.totalFocusTime || 0,
        });
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, navigate]);

  const handleAssignAdmin = async (userId: string) => {
    try {
      await updateUserRole(token as string, userId, "admin");
      // Update the user in the local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: "admin" } : user
        )
      );
      toast.success("User role updated to admin successfully!", {
        duration: 3000,
        position: "top-right",
        style: {
          background: "#151515",
          color: "#fff",
          border: "1px solid #333",
        },
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      setError("Failed to update user role.");
      toast.error("Failed to update user role.", {
        duration: 3000,
        position: "top-right",
        style: {
          background: "#151515",
          color: "#fff",
          border: "1px solid #333",
        },
      });
    }
  };

  // Format minutes to hours and minutes
  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 md:px-10 mt-23 py-6 relative">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        {/* 🔴 OVERVIEW TITLE */}
        <h1 className="text-4xl font-extrabold text-[#ffffff] mb-6">
          Overview
        </h1>

        {/* 📊 DASHBOARD STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#151515] p-4 rounded-2xl shadow-2xl border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <FaUserClock className="text-blue-400 text-2xl" />
            </div>
            <p className="text-gray-400">Active Users</p>
            <p className="text-2xl font-bold">{stats.activeUsers}</p>
            <p className="text-green-400">
              {Math.round(
                (stats.activeUsers / Math.max(1, stats.totalUsers)) * 100
              )}
              % of total
            </p>
          </div>

          <div className="bg-[#151515] p-4 rounded-2xl shadow-2xl border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <FaCrown className="text-purple-400 text-2xl" />
            </div>
            <p className="text-gray-400">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-green-400">Growing community</p>
          </div>

          <div className="bg-[#151515] p-4 rounded-2xl shadow-2xl border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <FaProjectDiagram className="text-green-400 text-2xl" />
            </div>
            <p className="text-gray-400">Total Projects</p>
            <p className="text-2xl font-bold">{stats.totalProjects}</p>
            <p className="text-green-400">Collaborative work</p>
          </div>

          <div className="bg-[#151515] p-4 rounded-2xl shadow-2xl border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <FaChartLine className="text-red-400 text-2xl" />
            </div>
            <p className="text-gray-400">Total Focus Time</p>
            <p className="text-2xl font-bold">
              {formatFocusTime(stats.totalFocusTime)}
            </p>
            <p className="text-green-400">Productivity hours</p>
          </div>
        </div>

        {/* 🔎 SEARCH & USER TABLE */}
        <div className="bg-[#151515] p-6 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Users</h2>
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black text-white px-6 py-3 rounded-full w-full pl-12 outline-none border border-gray-600 focus:border-red-500 transition"
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            </div>
          </div>

          {error && <p className="text-red-500">{error}</p>}
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.filter((user) =>user.username.toLowerCase().includes(search.toLowerCase())).map((user) => (
                  <div
                    key={user._id}
                    className="bg-[#151515] border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center justify-between"
                  >
                    <div className="grid grid-cols-5 w-full items-center">
                      {/* Username */}
                      <span className="font-semibold text-left">
                        {user.username}
                      </span>

                      {/* Role */}
                      <span
                        className={`font-bold ${
                          user.role === "admin"
                            ? "text-green-400"
                            : "text-blue-400"
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>

                      {/* Projects Count  */}
                      <span className="text-gray-300 text-center">
                        <FaProjectDiagram className="inline-block mr-2 text-green-400" />
                        {user.projectCount || 0} Projects
                      </span>

                      {/* Tasks */}
                      <span className="text-gray-300 text-center">
                        {user.tasksCompleted || 0} Tasks Done
                      </span>

                      {/* XP & Actions */}
                      <div className="flex items-center justify-end space-x-6">
                        <span className="text-yellow-400">
                          Level {user.level || 1}
                        </span>

                        {/* Actions Dropdown */}
                        <div className="relative">
                          <FaEllipsisV
                            className="text-gray-400 cursor-pointer"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === user._id ? null : user._id//null is for close the menu
                              )
                            }
                          />
                          {openMenu === user._id && (
                            <div className="absolute right-0 mt-2 bg-gray-900 p-2 shadow-md rounded-lg w-36 z-10">
                              {user.role !== "admin" && (
                                <button
                                  onClick={() => handleAssignAdmin(user._id)}
                                  className="text-green-500 hover:text-green-700 w-full text-left px-2 py-1"
                                >
                                  Assign as Admin
                                </button>
                              )}
                              {user.role === "admin" && (
                                <span className="text-gray-400 px-2 py-1 block">
                                  Already Admin
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
