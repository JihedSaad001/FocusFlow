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
      navigate('/signin'); // Redirect to login if not authenticated
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <h1 className="text-3xl">Welcome, {user?.username || 'User'}!</h1>
    </div>
  );
};

export default Dashboard;
