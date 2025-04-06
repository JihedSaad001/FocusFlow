"use client";

// Extend the Window interface to include custom properties
declare global {
  interface Window {
    ambientSoundsInitialized?: boolean;
    showAmbientSounds?: boolean;
  }
}

// User/App.js
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainMenu from "./components/MainMenu";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Home from "./components/Home";
import Workspace from "./components/Workspace/Workspace";
import KanbanBoard from "./components/KanbanBoard";
import Projects from "./components/Projects";
import CreateProject from "./components/CreateProject";
import ProjectDetails from "./components/ProjectDetails";
import PlanningSession from "./components/Poker/PlanningSession";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import AmbientSounds from "./components/Workspace/widgets/AmbientSounds";

// Global state for ambient sounds
if (typeof window !== "undefined") {
  // @ts-ignore - Add the ambientSoundsInitialized property to the window object
  window.ambientSoundsInitialized = window.ambientSoundsInitialized || false;
  // @ts-ignore - Add the showAmbientSounds property to the window object
  window.showAmbientSounds = window.showAmbientSounds || false;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));
  // State for persistent ambient sounds
  const [showAmbientSounds, setShowAmbientSounds] = useState(false);
  const [ambientSoundsInitialized, setAmbientSoundsInitialized] =
    useState(false);

  // ✅ Detect login/logout changes instantly
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("user"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Initialize ambient sounds state
  useEffect(() => {
    // Check if any ambient sounds are active
    const activeAmbientSound = localStorage.getItem("activeAmbientSound");

    // Initialize from window global or localStorage
    if (typeof window !== "undefined") {
      // @ts-ignore
      setAmbientSoundsInitialized(
        window.ambientSoundsInitialized || activeAmbientSound !== null
      );
      // @ts-ignore
      setShowAmbientSounds(window.showAmbientSounds || false);

      // Update the global variables
      if (activeAmbientSound) {
        // @ts-ignore
        window.ambientSoundsInitialized = true;
      }
    }

    // Listen for changes to the global variables
    const checkGlobals = () => {
      if (typeof window !== "undefined") {
        // @ts-ignore
        setShowAmbientSounds(window.showAmbientSounds || false);
        // @ts-ignore
        setAmbientSoundsInitialized(window.ambientSoundsInitialized || false);
      }
    };

    // Check periodically
    const interval = setInterval(checkGlobals, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle closing the ambient sounds panel
  const handleCloseAmbientSounds = () => {
    setShowAmbientSounds(false);
    // @ts-ignore
    if (typeof window !== "undefined") window.showAmbientSounds = false;
  };

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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/createProject" element={<CreateProject />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:id/poker" element={<PlanningSession />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </div>

        {/* Persistent AmbientSounds component - always mounted, visibility controlled by state */}
        {ambientSoundsInitialized && (
          <div
            style={{
              display: showAmbientSounds ? "block" : "none",
              position: "fixed",
              zIndex: 9999,
            }}
          >
            <AmbientSounds onClose={handleCloseAmbientSounds} />
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
