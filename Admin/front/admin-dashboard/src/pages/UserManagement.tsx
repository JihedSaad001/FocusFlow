import { useEffect, useState } from "react";
import { fetchUsers, deleteUser } from "../api";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { FaEllipsisV } from "react-icons/fa";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const loadUsers = async () => {
      try {
        const data = await fetchUsers(token);
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setError("Invalid API response.");
          setUsers([]);
        }
      } catch (err) {
        setError("Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [token, navigate]);

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(token as string, userId);
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen  bg-[#121212] text-white px-6 md:px-10 mt-23 py-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* 🔴 OVERVIEW TITLE */}
        <h1 className="text-4xl font-extrabold text-[#ffffff] mb-6">
          Overview
        </h1>

        {/* 📊 DASHBOARD STATS */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { title: "Active Users", value: "XXXX" },
            { title: "Total Users", value: "XXXX" },
            { title: "Placeholder", value: "XXXX" },
            { title: "Placeholder", value: "XXXX" },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-[#151515] p-4 rounded-2xl shadow-2xl border border-white/20 text-center"
            >
              <p className="text-gray-400">{item.title}</p>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-green-400">+15%</p>
            </div>
          ))}
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
            <p className="text-gray-300">Loading users...</p>
          ) : (
            <div className="space-y-4">
              {users
                .filter((user) =>
                  user.username.toLowerCase().includes(search.toLowerCase())
                )
                .map((user) => (
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

                      {/* Strikes */}
                      <span className="text-gray-300 text-center">
                        100 Strikes
                      </span>

                      {/* Tasks */}
                      <span className="text-gray-300 text-center">
                        75 Tasks Done
                      </span>

                      {/* Rewards & Actions */}
                      <div className="flex items-center justify-end space-x-6">
                        <span className="text-yellow-400">+Gold</span>

                        {/* Actions Dropdown */}
                        <div className="relative">
                          <FaEllipsisV
                            className="text-gray-400 cursor-pointer"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === user._id ? null : user._id
                              )
                            }
                          />
                          {openMenu === user._id && (
                            <div className="absolute right-0 mt-2 bg-gray-900 p-2 shadow-md rounded-lg w-24">
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="text-red-500 hover:text-red-700 w-full text-left px-2 py-1"
                              >
                                Delete
                              </button>
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
