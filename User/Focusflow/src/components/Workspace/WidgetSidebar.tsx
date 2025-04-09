import { Timer, CheckSquare, Headphones, Disc, Image } from "lucide-react";

const WidgetSidebar = ({
  onSelectFeature,
  setWallpaperButtonRef,
}: {
  onSelectFeature: (feature: string) => void;
  setWallpaperButtonRef: (ref: HTMLButtonElement | null) => void;
}) => {
  const features = [
    { key: "pomodoro", icon: <Timer className="w-6 h-6 text-gray-400" /> },
    { key: "todo", icon: <CheckSquare className="w-6 h-6 text-gray-400" /> },
    {
      key: "ambient-music",
      icon: <Headphones className="w-6 h-6 text-gray-400" />,
    },
    { key: "music-player", icon: <Disc className="w-6 h-6 text-gray-400" /> },

    { key: "wallpaper", icon: <Image className="w-6 h-6 text-gray-400" /> },
  ];

  return (
    <div
      className="fixed top-1/4 right-4 flex flex-col items-center bg-[#121212] 
      rounded-xl shadow-lg border border-transparent p-2 w-16 overflow-hidden
      transition-all duration-300 hover:border-gradient"
      style={{
        background: "linear-gradient(180deg, #FF5733, #9C27B0)", // Gradient border effect
        padding: "2px", // Outer padding to keep the gradient border
      }}
    >
      <div className="bg-[#181818] rounded-lg w-full flex flex-col py-3">
        {features.map((feature) => (
          <button
            key={feature.key}
            ref={feature.key === "wallpaper" ? setWallpaperButtonRef : null} // Store ref for wallpaper button
            onClick={() => onSelectFeature(feature.key)}
            className="p-4 w-full flex justify-center items-center rounded-md hover:bg-[#282828] transition-all duration-200"
          >
            {feature.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WidgetSidebar;
