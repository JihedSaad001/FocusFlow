import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem("user");
      setIsAuthenticated(!!user);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  // Public routes where we show the Navbar
  const publicRoutes = ["/", "/signin", "/signup"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#121212]">
      {isPublicRoute ? (
        <>
          <Navbar />
          <div className="pt-20">{children}</div>
        </>
      ) : (
        <div className="flex">
          {isAuthenticated && <Sidebar />}
          <main
            className={`flex-1 ${
              isAuthenticated ? "ml-64" : ""
            } p-8 bg-[#121212]`}
          >
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default Layout;
