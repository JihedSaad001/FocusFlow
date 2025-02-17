import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, X, Coffee, Brain } from "lucide-react";

const MODES = {
  FOCUS: {
    type: "focus",
    label: "Focus",
    defaultTime: 25,
    icon: Brain,
    borderColor: "border-[#D42F2F]",
  },
  SHORT_BREAK: {
    type: "shortBreak",
    label: "Short Break",
    defaultTime: 5,
    icon: Coffee,
    borderColor: "border-[#17E0B1]",
  },
  LONG_BREAK: {
    type: "longBreak",
    label: "Long Break",
    defaultTime: 15,
    icon: Coffee,
    borderColor: "border-[#FFFDFD]",
  },
};

interface PomodoroProps {
  onClose: () => void;
}

const Pomodoro = ({ onClose }: PomodoroProps) => {
  const [mode, setMode] = useState(MODES.FOCUS);
  const [time, setTime] = useState(() => {
    const savedTime = localStorage.getItem("pomodoroTime");
    return savedTime ? parseInt(savedTime, 10) : MODES.FOCUS.defaultTime * 60;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(() => {
    const savedMinutes = localStorage.getItem("pomodoroMinutes");
    return savedMinutes ? parseInt(savedMinutes, 10) : MODES.FOCUS.defaultTime;
  });

  const pomodoroRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef({
    x: window.innerWidth - 1200,
    y: window.innerHeight - 300,
  });
  const [position, setPosition] = useState(positionRef.current);
  const animationFrame = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    localStorage.setItem("pomodoroTime", time.toString());
    localStorage.setItem("pomodoroMinutes", customMinutes.toString());
  }, [time, customMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : prevTime));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  const applyCustomTime = () => {
    setTime(customMinutes * 60);
    setIsRunning(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX - positionRef.current.x;
    const startY = e.clientY - positionRef.current.y;

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;
      positionRef.current = {
        x: Math.min(
          window.innerWidth - 250,
          Math.max(10, event.clientX - startX)
        ),
        y: Math.min(
          window.innerHeight - 100,
          Math.max(10, event.clientY - startY)
        ),
      };
      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(() => {
          setPosition({ ...positionRef.current });
          animationFrame.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const ModeIcon = mode.icon;

  return (
    <div
      ref={pomodoroRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
        transition: isDragging.current ? "none" : "transform 0.2s ease-out",
      }}
      className={`fixed bg-[#121212] text-white rounded-xl shadow-lg p-5 w-64 transition-all cursor-grab active:cursor-grabbing 
      border-4 ${mode.borderColor}`}
    >
      {/* Header (Draggable) */}
      <div
        className="flex justify-between items-center cursor-grab active:cursor-grabbing mb-4"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-lg font-semibold flex items-center">
          <ModeIcon className="w-5 h-5 mr-2" /> {mode.label}
        </h3>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className="text-4xl font-bold">{formatTime(time)}</div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.values(MODES).map((m) => (
          <button
            key={m.type}
            onClick={() => {
              setMode(m);
              setTime(m.defaultTime * 60);
              setCustomMinutes(m.defaultTime);
              setIsRunning(false);
            }}
            className={`px-2 py-1 rounded text-xs font-medium ${
              mode.type === m.type
                ? "bg-[#333] shadow-inner"
                : "bg-[#222] hover:bg-[#333]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Custom Time Input */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <input
          type="number"
          min="1"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
          className="w-14 text-center bg-[#222] text-white border-none rounded p-1 text-sm"
        />
        <button
          onClick={applyCustomTime}
          className="px-2 py-1 bg-[#222] rounded text-sm hover:bg-[#333]"
        >
          Set
        </button>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-3 rounded-full bg-[#222] hover:bg-[#333] transition-all transform hover:scale-105"
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => {
            setTime(customMinutes * 60);
            setIsRunning(false);
          }}
          className="p-3 rounded-full bg-[#222] hover:bg-[#333] transition-all transform hover:scale-105"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pomodoro;
