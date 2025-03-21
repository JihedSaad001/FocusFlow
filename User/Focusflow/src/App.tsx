// User/App.js
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar"; // ✅ Navbar before login
import Sidebar from "./components/Sidebar"; // ✅ Sidebar after login
import MainMenu from "./components/MainMenu"; // ✅ Now correctly referenced
import Dashboard from "./components/Dashboard"; // ✅ Ensure this exists
import Profile from "./components/Profile"; // ✅ Ensure this exists
import SignIn from "./components/SignIn"; // ✅ Ensure this exists
import SignUp from "./components/SignUp"; // ✅ Ensure this exists
import Home from "./components/Home"; // ✅ Ensure this exists
import Workspace from "./components/Workspace/Workspace";
import KanbanBoard from "./components/KanbanBoard";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
import ProjectDetails from "./components/ProjectDetails";
import PlanningSession from "./components/Poker/PlanningSession";
// ✅ Ensure this exists
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));

  // ✅ Detect login/logout changes instantly
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("user"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#121212] ">
        {/* ✅ Show Sidebar when logged in, Navbar when logged out */}
        {isLoggedIn && <Sidebar />}
        <div className={`flex-1 ${isLoggedIn ? "ml-20" : ""} `}>
          {!isLoggedIn && <Navbar />}
          <Routes>
            <Route path="/" element={<MainMenu />} />{" "}
            {/* ✅ MainMenu is now correct */}
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/createProject" element={<CreateProject />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:id/poker" element={<PlanningSession />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
