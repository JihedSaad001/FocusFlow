import { useEffect, useState, useRef } from "react";
import WidgetSidebar from "./WidgetSidebar";
import WallpaperSelector from "./WallpaperSelector";
import Pomodoro from "./widgets/Pomodoro";
import ToDoList from "./widgets/ToDoList";
import AmbientSounds from "./widgets/AmbientSounds";
import MusicPlayer from "./widgets/MusicPlayer";
import YouTubePlayer from "./widgets/YouTubePlayer";

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
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

  // Keep track of which widgets have been initialized
  const [widgetsInitialized, setWidgetsInitialized] = useState({
    pomodoro: false,
    todoList: false,
    ambientSounds: false,
    musicPlayer: false,
  });

  useEffect(() => {
    // First try to get from localStorage for immediate display
    const storedWallpaper = localStorage.getItem("workspaceWallpaper");
    if (storedWallpaper) {
      setBackground(storedWallpaper);
    }

    // Then fetch from the backend to ensure we have the latest preference
    const fetchWallpaperFromBackend = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return; // Not logged in

        const response = await fetch(
          "https://focusflow-production.up.railway.app/api/user/wallpaper",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch wallpaper");

        const data = await response.json();
        if (data.wallpaper) {
          // Update both state and localStorage
          setBackground(data.wallpaper);
          localStorage.setItem("workspaceWallpaper", data.wallpaper);
        }
      } catch (err) {
        console.error("Error fetching wallpaper from backend:", err);
        // Fall back to localStorage (already handled above)
      }
    };

    fetchWallpaperFromBackend();
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
    } else if (widget === "music-player") {
      setShowMusicPlayer(true);
      setWidgetsInitialized((prev) => ({
        ...prev,
        musicPlayer: true,
      }));
    }
  };

  const openWallpaperSelector = () => {
    if (wallpaperButtonRef.current) {
      const rect = wallpaperButtonRef.current.getBoundingClientRect(); //display position
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

      {/* Music Player Widget - Only initialize once, then toggle visibility */}
      {widgetsInitialized.musicPlayer && (
        <div style={{ display: showMusicPlayer ? "block" : "none" }}>
          <MusicPlayer onClose={() => setShowMusicPlayer(false)} />
        </div>
      )}

      {/* YouTube Player is Always Visible */}
      <YouTubePlayer />
    </div>
  );
};

export default Workspace;
