"use client";

import { useEffect, useState, useRef } from "react";
import WidgetSidebar from "./WidgetSidebar";
import WallpaperSelector from "./WallpaperSelector";
import Pomodoro from "./widgets/Pomodoro";
import ToDoList from "./widgets/ToDoList";
import YouTubePlayer from "./widgets/YouTubePlayer";
import AmbientSounds from "./widgets/AmbientSounds";

const Workspace = () => {
  const [background, setBackground] = useState(
    localStorage.getItem("workspaceWallpaper") || ""
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const wallpaperButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showToDoList, setShowToDoList] = useState(false);
  const [showAmbientSounds, setShowAmbientSounds] = useState(false);

  // Keep track of which widgets have been initialized
  const [widgetsInitialized, setWidgetsInitialized] = useState({
    pomodoro: false,
    todoList: false,
    ambientSounds: false,
  });

  useEffect(() => {
    const storedWallpaper = localStorage.getItem("workspaceWallpaper");
    if (storedWallpaper) {
      setBackground(storedWallpaper);
    }

    // Check if any ambient sounds are active
    const activeAmbientSound = localStorage.getItem("activeAmbientSound");
    if (activeAmbientSound) {
      // Initialize the ambient sounds widget if sounds are playing
      setWidgetsInitialized((prev) => ({
        ...prev,
        ambientSounds: true,
      }));
    }
  }, []);

  const handleWidgetOpen = (widget: string) => {
    if (widget === "wallpaper") {
      openWallpaperSelector();
    } else if (widget === "pomodoro") {
      setShowPomodoro(true);
      setWidgetsInitialized((prev) => ({
        ...prev,
        pomodoro: true,
      }));
    } else if (widget === "todo") {
      setShowToDoList(true);
      setWidgetsInitialized((prev) => ({
        ...prev,
        todoList: true,
      }));
    } else if (widget === "ambient-music") {
      setShowAmbientSounds(true);
      setWidgetsInitialized((prev) => ({
        ...prev,
        ambientSounds: true,
      }));
    }
  };

  const openWallpaperSelector = () => {
    if (wallpaperButtonRef.current) {
      const rect = wallpaperButtonRef.current.getBoundingClientRect();
      setSelectorPosition({
        x: Math.max(20, rect.left - 280),
        y: Math.min(window.innerHeight - 450, rect.top),
      });
    }
    setIsSelectorOpen(true);
  };

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col transition-all duration-300 overflow-hidden"
      style={{
        backgroundImage: background ? `url(${background})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Sidebar for Widgets */}
      <WidgetSidebar
        onSelectFeature={handleWidgetOpen}
        setWallpaperButtonRef={(ref) => (wallpaperButtonRef.current = ref)}
      />

      {/* Wallpaper Selector */}
      {isSelectorOpen && (
        <WallpaperSelector
          onWallpaperChange={(url) => {
            setBackground(url);
            setIsSelectorOpen(false);
          }}
          onClose={() => setIsSelectorOpen(false)}
          position={selectorPosition}
        />
      )}

      {/* Pomodoro Widget - Only initialize once, then toggle visibility */}
      {widgetsInitialized.pomodoro && (
        <div style={{ display: showPomodoro ? "block" : "none" }}>
          <Pomodoro onClose={() => setShowPomodoro(false)} />
        </div>
      )}

      {/* To-Do List Widget - Only initialize once, then toggle visibility */}
      {widgetsInitialized.todoList && (
        <div style={{ display: showToDoList ? "block" : "none" }}>
          <ToDoList onClose={() => setShowToDoList(false)} />
        </div>
      )}

      {/* Ambient Sounds Widget - Only initialize once, then toggle visibility */}
      {widgetsInitialized.ambientSounds && (
        <div style={{ display: showAmbientSounds ? "block" : "none" }}>
          <AmbientSounds onClose={() => setShowAmbientSounds(false)} />
        </div>
      )}

      {/* YouTube Player is Always Visible */}
      <YouTubePlayer />
    </div>
  );
};

export default Workspace;
