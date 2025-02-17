import { useEffect, useState, useRef } from "react";
import WidgetSidebar from "./WidgetSidebar";
import WallpaperSelector from "./WallpaperSelector";
import Pomodoro from "./widgets/Pomodoro";
import ToDoList from "./widgets/ToDoList";
import YouTubePlayer from "./widgets/YouTubePlayer"; // ✅ Import YouTubePlayer

const Workspace = () => {
  const [background, setBackground] = useState(
    localStorage.getItem("workspaceWallpaper") || ""
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const wallpaperButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showToDoList, setShowToDoList] = useState(false);

  useEffect(() => {
    const storedWallpaper = localStorage.getItem("workspaceWallpaper");
    if (storedWallpaper) {
      setBackground(storedWallpaper);
    }
  }, []);

  const handleWidgetOpen = (widget: string) => {
    if (widget === "wallpaper") {
      openWallpaperSelector();
    } else if (widget === "pomodoro") {
      setShowPomodoro(true);
    } else if (widget === "todo") {
      setShowToDoList(true);
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

      {/* Pomodoro Widget */}
      {showPomodoro && <Pomodoro onClose={() => setShowPomodoro(false)} />}

      {/* To-Do List Widget */}
      {showToDoList && <ToDoList onClose={() => setShowToDoList(false)} />}

      {/* ✅ YouTube Player is Always Visible */}
      <YouTubePlayer />
    </div>
  );
};

export default Workspace;
