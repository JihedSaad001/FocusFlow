import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">
        Welcome back, {user?.username || 'User'}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placeholder for draggable/resizable components */}
        <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Pomodoro Timer</h2>
          <p className="text-gray-400">Your timer component will go here</p>
        </div>
        <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Todo List</h2>
          <p className="text-gray-400">Your todo list component will go here</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;