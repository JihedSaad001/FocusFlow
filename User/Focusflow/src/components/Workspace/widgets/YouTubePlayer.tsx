import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Search, X, Move } from "lucide-react";
import Draggable from "react-draggable";

const YouTubePlayer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [videoID, setVideoID] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [isResizingActive, setIsResizingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isResizing = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const dragEndTimer = useRef<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Replace with your YouTube Data API key (secure in production)
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Cleanup animation frame and timers on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (dragEndTimer.current) {
        clearTimeout(dragEndTimer.current);
      }
    };
  }, []);

  
  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=video&maxResults=8&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        setSearchResults(data.items);
      } else {
        setSearchResults([]);
        setError("No videos found for this search.");
      }
    } catch (err) {
      console.error(err);
      setError("Error searching videos. Please try again.");
      setSearchResults([]);
    }
  };

  // Play selected video
  const playVideo = (videoId: string) => {
    setVideoID(videoId);
    setSearchResults([]); // Clear results after selection
    setSearchQuery(""); // Clear search input
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    setIsResizingActive(true);
    lastMousePosition.current = { x: e.clientX, y: e.clientY };

    const handleResizeMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return;

      const deltaX = event.clientX - lastMousePosition.current.x;
      const deltaY = event.clientY - lastMousePosition.current.y;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };

      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(() => {
          setSize((prev) => ({
            width: Math.max(320, prev.width + deltaX),
            height: Math.max(180, prev.height + deltaY),
          }));
          animationFrame.current = null;
        });
      }
    };

    const handleResizeMouseUp = () => {
      isResizing.current = false;
      if (dragEndTimer.current) clearTimeout(dragEndTimer.current);
      dragEndTimer.current = setTimeout(() => {
        setIsResizingActive(false);
      }, 100);

      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };

    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search for focus music or videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="flex-1 px-5 py-3 bg-[#0D0D0D] text-white text-lg placeholder-gray-400 border border-[#ff4e50] rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff4e50] transition-all duration-300"
        />
        <button
          onClick={handleSearch}
          className="p-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl shadow-lg hover:bg-[#e0443e] transition-all duration-300"
        >
          <Search className="w-6 h-6" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 bg-red-900/30 text-red-300 p-2 rounded-md text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-4 max-h-[300px] overflow-y-auto bg-[#0D0D0D] rounded-xl p-4">
          {searchResults.map((item) => (
            <div
              key={item.id.videoId}
              className="flex items-center space-x-4 p-2 hover:bg-[#252525] rounded-lg cursor-pointer"
              onClick={() => playVideo(item.id.videoId)}
            >
              <img
                src={item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="w-24 h-16 object-cover rounded"
              />
              <div>
                <p className="text-white text-sm font-medium">
                  {item.snippet.title}
                </p>
                <p className="text-gray-400 text-xs">
                  {item.snippet.channelTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Window */}
      {videoID && (
        <Draggable
          nodeRef={nodeRef}
          handle=".drag-handle"
          bounds="body"
          defaultPosition={{
            x: window.innerWidth / 2 - size.width / 2,
            y: 100,
          }}
        >
          <div
            ref={nodeRef}
            style={{
              width: `${size.width}px`,
              height: `${size.height}px`,
              willChange: isResizingActive ? "width, height" : "auto",
            }}
            className="fixed bg-[#121212] backdrop-blur-xl bg-opacity-90 p-4 rounded-xl shadow-2xl z-50 border border-[#ff4e50]"
          >
            {/* Header (Draggable) */}
            <div className="flex justify-between items-center drag-handle cursor-move px-3 py-2 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Move className="w-5 h-5 text-gray-400" />
                <span className="text-white text-sm font-semibold">
                  YouTube Player
                </span>
              </div>
              <button
                onClick={() => setVideoID(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Inside the Box */}
            <div
              style={{
                width: "100%",
                height: "calc(100% - 40px)",
                overflow: "hidden",
              }}
              className="rounded-lg"
            >
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoID}`}
                title="YouTube video player"
                frameBorder="0"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-2 right-2 w-5 h-5 bg-[#ff4e50] rounded-br-xl cursor-se-resize"
              onMouseDown={handleResizeMouseDown}
            ></div>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default YouTubePlayer;
