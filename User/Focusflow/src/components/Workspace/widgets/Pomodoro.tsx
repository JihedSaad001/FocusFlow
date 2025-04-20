"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, X, Coffee, Brain } from "lucide-react";
import { useDraggable } from "../hooks/use-draggable";
import { userDataAPI } from "../../../services/api";

// Add this utility function at the top of the file
const setupTimerCompletionHandler = () => {
  const checkTimer = () => {
    const running = localStorage.getItem("pomodoroRunning");
    if (running === "true") {
      const endTime = Number(localStorage.getItem("pomodoroEndTime"));
      const storedMode = localStorage.getItem("pomodoroMode");
      const storedInitialDuration = Number(
        localStorage.getItem("pomodoroInitialDuration")
      );

      if (endTime && Date.now() >= endTime) {
        // Play notification sound
        try {
          const audio = new Audio("/Notification.mp3");
          audio
            .play()
            .catch((error) => console.log("Error playing sound:", error));
        } catch (error) {
          console.error("Error playing audio:", error);
        }

        // Log focus session if it was a focus mode
        if (storedMode === "focus") {
          const token = localStorage.getItem("token");
          if (token && storedInitialDuration) {
            const durationMinutes = Math.round(storedInitialDuration / 60);
            if (durationMinutes >= 1) {
              userDataAPI
                .logFocusSession(
                  durationMinutes,
                  true,
                  localStorage.getItem("activeAmbientSound") || undefined
                )
                .catch((error) =>
                  console.error("Error logging session:", error)
                );
            }
          }

          // Automatically start short break after focus session
          localStorage.setItem("pomodoroMode", "shortBreak");
          localStorage.setItem("pomodoroTime", (5 * 60).toString()); // 5 minutes for short break
          localStorage.setItem("pomodoroMinutes", "5");
          localStorage.setItem("pomodoroRunning", "true");
          localStorage.setItem(
            "pomodoroEndTime",
            (Date.now() + 5 * 60 * 1000).toString()
          );
          localStorage.setItem("pomodoroInitialDuration", (5 * 60).toString());

          // Force reload the component to show the new mode
          window.dispatchEvent(new Event("storage"));
          return;
        } else {
          // For breaks, just clean up
          localStorage.removeItem("pomodoroRunning");
          localStorage.removeItem("pomodoroEndTime");
          localStorage.removeItem("pomodoroMode");
          localStorage.removeItem("pomodoroInitialDuration");
          localStorage.setItem(
            "pomodoroTime",
            (
              (storedMode === "focus"
                ? 25
                : storedMode === "shortBreak"
                ? 5
                : 15) * 60
            ).toString()
          );
        }
      }
    }
  };

  // Check every second
  setInterval(checkTimer, 1000);
};

// Run this once when the app loads
if (typeof window !== "undefined") {
  setupTimerCompletionHandler();
}

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
    return savedTime
      ? Number.parseInt(savedTime, 10)
      : MODES.FOCUS.defaultTime * 60;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(() => {
    const savedMinutes = localStorage.getItem("pomodoroMinutes");
    return savedMinutes
      ? Number.parseInt(savedMinutes, 10)
      : MODES.FOCUS.defaultTime;
  });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [initialDuration, setInitialDuration] = useState<number>(0);
  const [currentAmbientSound, setCurrentAmbientSound] = useState<string | null>(
    null
  );

  const { position, handleMouseDown, isDragging } = useDraggable({
    initialPosition: {
      x: window.innerWidth - 1200,
      y: window.innerHeight - 300,
    },
    boundaryPadding: 10,
  });

  useEffect(() => {
    const checkAmbientSound = () => {
      const activeSound = localStorage.getItem("activeAmbientSound");
      setCurrentAmbientSound(activeSound);
    };

    // Listen for storage events (for cross-tab synchronization)
    const handleStorageChange = () => {
      const storedMode = localStorage.getItem("pomodoroMode");
      const storedTime = localStorage.getItem("pomodoroTime");
      const running = localStorage.getItem("pomodoroRunning");

      if (storedMode) {
        Object.values(MODES).forEach((m) => {
          if (m.type === storedMode) setMode(m);
        });
      }

      if (storedTime) {
        setTime(Number(storedTime));
      }

      if (running === "true") {
        setIsRunning(true);
      } else if (running === null) {
        setIsRunning(false);
      }
    };

    checkAmbientSound();
    const interval = setInterval(checkAmbientSound, 5000);

    // Add event listener for storage events
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("pomodoroTime", time.toString());
    localStorage.setItem("pomodoroMinutes", customMinutes.toString());
    if (isRunning) {
      localStorage.setItem("pomodoroRunning", "true");
      localStorage.setItem("pomodoroMode", mode.type);
      localStorage.setItem(
        "pomodoroEndTime",
        (Date.now() + time * 1000).toString()
      );
      localStorage.setItem(
        "pomodoroInitialDuration",
        initialDuration.toString()
      );
    }
  }, [time, customMinutes, isRunning, mode.type, initialDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
        setInitialDuration(time);
      }

      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval!);
            setIsRunning(false);
            setSessionStartTime(null);

            // If focus mode just ended, automatically switch to short break
            if (mode.type === "focus") {
              // Log the completed focus session
              logSessionToServer(true);

              // Play notification sound
              try {
                const audio = new Audio("/Notification.mp3");
                audio
                  .play()
                  .catch((error) => console.log("Error playing sound:", error));
              } catch (error) {
                console.error("Error playing audio:", error);
              }

              // Switch to short break mode
              setTimeout(() => {
                setMode(MODES.SHORT_BREAK);
                setTime(MODES.SHORT_BREAK.defaultTime * 60);
                setCustomMinutes(MODES.SHORT_BREAK.defaultTime);
                setIsRunning(true); // Auto-start the short break
              }, 500); // Small delay to ensure state updates properly
            }

            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, sessionStartTime, mode.type]);

  useEffect(() => {
    const resumeTimer = () => {
      const running = localStorage.getItem("pomodoroRunning");
      if (running === "true") {
        const endTime = Number(localStorage.getItem("pomodoroEndTime"));
        const storedMode = localStorage.getItem("pomodoroMode");
        const storedInitialDuration = Number(
          localStorage.getItem("pomodoroInitialDuration")
        );

        if (endTime && storedMode) {
          const remainingTime = Math.max(
            0,
            Math.floor((endTime - Date.now()) / 1000)
          );

          if (remainingTime > 0) {
            setTime(remainingTime);
            setIsRunning(true);
            setSessionStartTime(
              new Date(endTime - storedInitialDuration * 1000)
            );
            setInitialDuration(storedInitialDuration);
            Object.values(MODES).forEach((m) => {
              if (m.type === storedMode) setMode(m);
            });
          }
        }
      }
    };

    resumeTimer();
  }, [customMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  const applyCustomTime = () => {
    setTime(customMinutes * 60);
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const handlePlayPause = () => {
    if (isRunning) {
      if (mode.type === "focus" && sessionStartTime) {
        logSessionToServer(false);
      }
      setIsRunning(false);
      setSessionStartTime(null);
      localStorage.removeItem("pomodoroRunning");
    } else {
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    if (mode.type === "focus" && isRunning && sessionStartTime) {
      logSessionToServer(false);
    }
    setTime(customMinutes * 60);
    setIsRunning(false);
    setSessionStartTime(null);
    localStorage.removeItem("pomodoroRunning");
  };

  const logSessionToServer = async (completed: boolean) => {
    if (mode.type !== "focus") return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let durationMinutes = sessionStartTime
        ? Math.round((initialDuration - time) / 60)
        : Math.round(initialDuration / 60);

      if (durationMinutes < 1) return;

      await userDataAPI.logFocusSession(
        durationMinutes,
        completed,
        currentAmbientSound || undefined
      );
    } catch (error) {
      console.error("Failed to log focus session:", error);
    }
  };

  const handleClose = () => {
    if (mode.type === "focus" && isRunning && sessionStartTime) {
      logSessionToServer(false);
    }
    onClose();
  };

  const ModeIcon = mode.icon;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
        transition: isDragging ? "none" : "transform 0.2s ease-out",
      }}
      className={`fixed bg-[#121212] text-white rounded-xl shadow-lg p-5 w-64 transition-all cursor-grab active:cursor-grabbing
      border-4 ${mode.borderColor}`}
    >
      <div
        className="flex justify-between items-center cursor-grab active:cursor-grabbing mb-4"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-lg font-semibold flex items-center">
          <ModeIcon className="w-5 h-5 mr-2" /> {mode.label}
        </h3>
        <button
          onClick={handleClose}
          className="text-white/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold">{formatTime(time)}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.values(MODES).map((m) => (
          <button
            key={m.type}
            onClick={() => {
              if (mode.type === "focus" && isRunning && sessionStartTime) {
                logSessionToServer(false);
              }
              setMode(m);
              setTime(m.defaultTime * 60);
              setCustomMinutes(m.defaultTime);
              setIsRunning(false);
              setSessionStartTime(null);
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

      <div className="flex items-center justify-center space-x-2 mb-4">
        <input
          type="number"
          min="1"
          value={customMinutes}
          onChange={(e) =>
            setCustomMinutes(Number.parseInt(e.target.value, 10))
          }
          className="w-14 text-center bg-[#222] text-white border-none rounded p-1 text-sm"
        />
        <button
          onClick={applyCustomTime}
          className="px-2 py-1 bg-[#222] rounded text-sm hover:bg-[#333]"
        >
          Set
        </button>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-[#222] hover:bg-[#333] transition-all transform hover:scale-105"
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleReset}
          className="p-3 rounded-full bg-[#222] hover:bg-[#333] transition-all transform hover:scale-105"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {currentAmbientSound && (
        <div className="mt-4 text-center text-xs text-gray-400">
          Using: {currentAmbientSound}
        </div>
      )}
    </div>
  );
};

export default Pomodoro;
