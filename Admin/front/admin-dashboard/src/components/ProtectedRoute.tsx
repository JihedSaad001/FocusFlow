import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  console.log("🔍 Checking Protected Route");
  console.log("✅ Token:", token);
  console.log("👤 Role:", role);

  if (!token) {
    console.warn("🔒 No token found, redirecting to login...");
    return <Navigate to="/admin/login" />;
  }

  if (role !== "admin") {
    console.warn("⛔ Access Denied: Not an admin, redirecting...");
    return <Navigate to="/admin/login" />;
  }

  console.log("✅ Access granted, showing admin dashboard...");
  return <Outlet />;
};

export default ProtectedRoute;
