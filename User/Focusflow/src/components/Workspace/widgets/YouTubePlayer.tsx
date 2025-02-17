import { useState, useRef } from "react";
import { Play, X, Move } from "lucide-react";

const YouTubePlayer = () => {
  const [videoURL, setVideoURL] = useState("");
  const [videoID, setVideoID] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  
  const searchBarRef = useRef<HTMLDivElement | null>(null);

  // Extract Video ID from YouTube URL
  const extractVideoID = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
  };

  // Play Video & Auto-Position Below Search Bar
  const handlePlay = () => {
    const id = extractVideoID(videoURL);
    if (id) {
      setVideoID(id);

      // Auto-position below search bar
      if (searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect();
        setPosition({
          x: rect.left + 50, // Align with search bar
          y: rect.bottom + 10, // Just below search bar
        });
      }
    }
  };

  // Handle Dragging with Super Smooth Animation
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - lastMousePosition.current.x;
      const deltaY = event.clientY - lastMousePosition.current.y;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };

      setPosition((prev) => ({
        x: Math.max(
          10,
          Math.min(window.innerWidth - size.width - 10, prev.x + deltaX)
        ),
        y: Math.max(
          10,
          Math.min(window.innerHeight - size.height - 10, prev.y + deltaY)
        ),
      }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle Resizing
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };

    const handleResizeMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return;

      const deltaX = event.clientX - lastMousePosition.current.x;
      const deltaY = event.clientY - lastMousePosition.current.y;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };

      setSize((prev) => ({
        width: Math.max(320, prev.width + deltaX),
        height: Math.max(180, prev.height + deltaY),
      }));
    };

    const handleResizeMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };

    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      {/* Input Bar */}
      <div ref={searchBarRef} className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Paste your YouTube link"
          value={videoURL}
          onChange={(e) => setVideoURL(e.target.value)}
          className="flex-1 px-5 py-3 bg-[#0D0D0D] text-white text-lg placeholder-gray-400 border border-[#ff4e50] rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff4e50] transition-all duration-300"
        />
        <button
          onClick={handlePlay}
          className="p-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl shadow-lg hover:bg-[#e0443e] transition-all duration-300"
        >
          <Play className="w-6 h-6" />
        </button>
      </div>

      {/* Video Player Window */}
      {videoID && (
        <div
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          className="fixed bg-[#121212] backdrop-blur-xl bg-opacity-90 p-4 rounded-xl shadow-2xl z-50 transition-all cursor-grab border border-[#ff4e50]"
        >
          {/* Header (Draggable) */}
          <div
            className="flex justify-between items-center cursor-grab active:cursor-grabbing px-3 py-2 border-b border-gray-700"
            onMouseDown={handleMouseDown}
          >
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

          {/* Video Inside the Box (Fixed Sizing) */}
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
      )}
    </div>
  );
};

export default YouTubePlayer;
