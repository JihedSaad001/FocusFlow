import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import UserManagement from "./pages/UserManagement";
import ResourcesDatabase from "./pages/ResourcesDatabase";
import Dashboards from "./pages/Dashboards";
import Navbar from "./components/NavBarAdmin"; // ✅ Import Navbar

function ProtectedRoute({ element }: { element: JSX.Element }) {
  const token = localStorage.getItem("adminToken");
  return token ? element : <Navigate to="/admin/login" />;
}

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/admin/login"; // ✅ Hide Navbar on Login Page

  return (
    <>
      {!hideNavbar && <Navbar />}{" "}
      {/* ✅ Show Navbar only if NOT on login page */}
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute element={<UserManagement />} />}
        />
        <Route
          path="/admin/resources"
          element={<ProtectedRoute element={<ResourcesDatabase />} />}
        />
        <Route
          path="/admin/dashboards"
          element={<ProtectedRoute element={<Dashboards />} />}
        />
        <Route path="/" element={<Navigate to="/admin/login" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
