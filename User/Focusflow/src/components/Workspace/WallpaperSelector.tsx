import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface WallpaperSelectorProps {
  onWallpaperChange: (url: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const WallpaperSelector = ({
  onWallpaperChange,
  onClose,
  position,
}: WallpaperSelectorProps) => {
  const [wallpapers, setWallpapers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const fetchWallpapers = async () => {
    try {
      console.log("Fetching wallpapers from MongoDB...");

      const response = await fetch(
        "focusflow-production.up.railway.app/api/resources/wallpapers"
      );
      if (!response.ok) throw new Error("Failed to fetch wallpapers");

      const data = await response.json();
      console.log("Fetched Wallpapers:", data);

      const wallpaperUrls = data.map(
        (wallpaper: { url: string }) => wallpaper.url
      );
      setWallpapers(wallpaperUrls);
    } catch (err) {
      console.error("Error fetching wallpapers:", err);
      setError("Failed to load wallpapers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to save the selected wallpaper to the backend
  const saveWallpaperToBackend = async (url: string) => {
    try {
      const token = localStorage.getItem("token"); // Get the user's token from localStorage
      if (!token) throw new Error("User not authenticated");

      const response = await fetch("/api/user/wallpaper", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wallpaperUrl: url }),
      });

      if (!response.ok) throw new Error("Failed to save wallpaper");

      console.log("Wallpaper saved successfully:", url);
    } catch (err) {
      console.error("Error saving wallpaper:", err);
    }
  };

  const handleWallpaperSelect = (url: string) => {
    console.log("Selected wallpaper:", url);
    localStorage.setItem("workspaceWallpaper", url); // Save to localStorage
    onWallpaperChange(url); // Update the UI
    saveWallpaperToBackend(url); // Save to backend
  };

  return (
    <div
      className="fixed bg-[#1a1a1a] shadow-xl border-3 border-[#ff4e50] rounded-lg overflow-hidden z-50"
      style={{
        left: `${position.x - 10}px`, // ✅ Moves it to the left of the sidebar
        top: `${position.y - 60}px`,
        transform: "translate(-50%, -50%)", // Keeps it centered on button click
        minWidth: "500px",
        maxWidth: "600px",
      }}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Choose Wallpaper</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wallpapers.map((url, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 border border-gray-200 shadow-sm"
                onClick={() => handleWallpaperSelect(url)}
              >
                <img
                  src={url}
                  alt={`Wallpaper ${index + 1}`}
                  className="w-full h-32 object-cover transition-all duration-500 group-hover:brightness-75"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 text-white font-medium">
                  Select
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WallpaperSelector;
