import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!(user && token));
  }, []);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
