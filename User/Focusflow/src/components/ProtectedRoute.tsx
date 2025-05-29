import { Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import Sidebar from "./Sidebar";

const ProtectedRoute = ({ children }: PropsWithChildren) => {
  // Check authentication immediately - no loading state needed
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const isAuthenticated = !!(user && token);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  
  return (
    <>
      <Sidebar />
      <div className="ml-20">{children}</div>
    </>
  );
};

export default ProtectedRoute;
