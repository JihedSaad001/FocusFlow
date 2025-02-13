import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, ListTodo, User, LogOut } from 'lucide-react';

const defaultProfilePic = "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png";

const Sidebar = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    navigate('/signin');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#1E1E1E] text-white shadow-xl flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <span className="text-2xl font-extrabold bg-gradient-to-r from-[#ff4e50] to-[#fc913a] text-transparent bg-clip-text">
          FocusFlow
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/pomodoro')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-black/20 transition group"
          >
            <Timer className="w-5 h-5 text-[#ff4e50] group-hover:scale-110 transition" />
            <span>Pomodoro Timer</span>
          </button>

          <button
            onClick={() => navigate('/todo')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-black/20 transition group"
          >
            <ListTodo className="w-5 h-5 text-[#fc913a] group-hover:scale-110 transition" />
            <span>Todo List</span>
          </button>
        </div>
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-black/20 transition"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <img
              src={user?.profilePic || defaultProfilePic}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-gray-500"
            />
            <span className="flex-1 text-left">{user?.username}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-[#252525] rounded-lg shadow-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => {
                  navigate('/profile');
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-black/20 transition"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-black/20 transition text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;