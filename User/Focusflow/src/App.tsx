// Extend the Window interface to include custom properties
declare global {
  interface Window {
    ambientSoundsInitialized?: boolean;
    showAmbientSounds?: boolean;
    musicPlayerInitialized?: boolean;
    showMusicPlayer?: boolean;
  }
}

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
import MusicPlayer from "./components/Workspace/widgets/MusicPlayer";

// Global state for ambient sounds and music player
if (typeof window !== "undefined") {
  // @ts-ignore
  window.ambientSoundsInitialized = window.ambientSoundsInitialized || false;
  // @ts-ignore
  window.showAmbientSounds = window.showAmbientSounds || false;
  // @ts-ignore
  window.musicPlayerInitialized = window.musicPlayerInitialized || false;
  // @ts-ignore
  window.showMusicPlayer = window.showMusicPlayer || false;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));
  // State for persistent ambient sounds and music player
  const [showAmbientSounds, setShowAmbientSounds] = useState(false);
  const [ambientSoundsInitialized, setAmbientSoundsInitialized] =
    useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [musicPlayerInitialized, setMusicPlayerInitialized] = useState(false);

  // Detect login/logout changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("user"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Initialize ambient sounds and music player state
  useEffect(() => {
    // Check if any ambient sounds or music tracks are active
    const activeAmbientSound = localStorage.getItem("activeAmbientSound");
    const activeMusicTrack = localStorage.getItem("activeMusicTrack");

    // Initialize from window global or localStorage
    if (typeof window !== "undefined") {
      // @ts-ignore
      setAmbientSoundsInitialized(
        window.ambientSoundsInitialized || activeAmbientSound !== null
      );
      // @ts-ignore
      setShowAmbientSounds(window.showAmbientSounds || false);
      // @ts-ignore
      setMusicPlayerInitialized(
        window.musicPlayerInitialized || activeMusicTrack !== null
      );
      // @ts-ignore
      setShowMusicPlayer(window.showMusicPlayer || false);

      // Update the global variables
      if (activeAmbientSound) {
        // @ts-ignore
        window.ambientSoundsInitialized = true;
      }
      if (activeMusicTrack) {
        // @ts-ignore
        window.musicPlayerInitialized = true;
      }
    }

    // Listen for changes to the global variables
    const checkGlobals = () => {
      if (typeof window !== "undefined") {
        // @ts-ignore
        setShowAmbientSounds(window.showAmbientSounds || false);
        // @ts-ignore
        setAmbientSoundsInitialized(window.ambientSoundsInitialized || false);
        // @ts-ignore
        setShowMusicPlayer(window.showMusicPlayer || false);
        // @ts-ignore
        setMusicPlayerInitialized(window.musicPlayerInitialized || false);
      }
    };

    const interval = setInterval(checkGlobals, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle closing the ambient sounds panel
  const handleCloseAmbientSounds = () => {
    setShowAmbientSounds(false);
    // @ts-ignore
    if (typeof window !== "undefined") window.showAmbientSounds = false;
  };

  // Handle closing the music player panel
  const handleCloseMusicPlayer = () => {
    setShowMusicPlayer(false);
    // @ts-ignore
    if (typeof window !== "undefined") window.showMusicPlayer = false;
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#121212] ">
        {/* Show Sidebar when logged in, Navbar when logged out */}
        {isLoggedIn && <Sidebar />}
        <div className={`flex-1 ${isLoggedIn ? "ml-20" : ""} `}>
          {!isLoggedIn && <Navbar />}
          <Routes>
            <Route path="/" element={<MainMenu />} />
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

        {/* Persistent AmbientSounds component */}
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

        {/* Persistent MusicPlayer component */}
        {musicPlayerInitialized && (
          <div
            style={{
              display: showMusicPlayer ? "block" : "none",
              position: "fixed",
              zIndex: 9999,
            }}
          >
            <MusicPlayer onClose={handleCloseMusicPlayer} />
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
