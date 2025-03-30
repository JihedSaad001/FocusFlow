"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Draggable from "react-draggable";

type AmbientSound = {
  _id: string;
  name: string;
  url: string;
  tags: string[];
};

type ActiveSound = {
  id: string;
  name: string;
  url: string;
  audio: HTMLAudioElement;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  showVolumeControl: boolean;
};

const AmbientSounds = ({ onClose }: { onClose: () => void }) => {
  const [sounds, setSounds] = useState<AmbientSound[]>([]);
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([]);
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousMasterVolumeRef = useRef(70);
  const nodeRef = useRef(null);

  useEffect(() => {
    fetchAmbientSounds();

    // Cleanup function
    return () => {
      activeSounds.forEach((sound) => {
        try {
          sound.audio.pause();
        } catch (err) {
          console.error("Error pausing audio during cleanup:", err);
        }
      });
    };
  }, []);

  const fetchAmbientSounds = async () => {
    try {
      console.log("Fetching ambient sounds from MongoDB...");

      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/resources/ambient-sounds"
      );
      if (!response.ok) throw new Error("Failed to fetch ambient sounds");

      const data = await response.json();
      console.log("Fetched Ambient Sounds:", data);

      setSounds(data);
    } catch (err) {
      console.error("Error fetching ambient sounds:", err);
      setError("Failed to load ambient sounds. Using default sounds instead.");
      // Set default sounds if API fails
      setSounds(getDefaultSounds());
    } finally {
      setIsLoading(false);
    }
  };

  // Default sounds as fallback
  const getDefaultSounds = (): AmbientSound[] => [
    {
      _id: "default-1",
      name: "Rainforest",
      url: "https://cdn.freesound.org/previews/18/18765_18799-lq.mp3",
      tags: ["nature", "rain"],
    },
    {
      _id: "default-2",
      name: "Ocean Waves",
      url: "https://cdn.freesound.org/previews/47/47539_35187-lq.mp3",
      tags: ["nature", "water"],
    },
    {
      _id: "default-3",
      name: "Thunderstorm",
      url: "https://cdn.freesound.org/previews/2/2523_4205-lq.mp3",
      tags: ["nature", "storm"],
    },
    {
      _id: "default-4",
      name: "Campfire",
      url: "https://cdn.freesound.org/previews/32/32443_151350-lq.mp3",
      tags: ["fire", "cozy"],
    },
  ];

  // Calculate and apply volume for a sound based on its individual volume and master volume
  const calculateVolume = (soundVolume: number, isSoundMuted: boolean) => {
    if (isMasterMuted || isSoundMuted) return 0;
    return (soundVolume / 100) * (masterVolume / 100);
  };

  // Apply volume changes to all active sounds when master volume changes
  useEffect(() => {
    activeSounds.forEach((sound) => {
      try {
        sound.audio.volume = calculateVolume(sound.volume, sound.isMuted);
      } catch (err) {
        console.error("Error setting volume:", err);
      }
    });
  }, [masterVolume, isMasterMuted, activeSounds]);

  const handleSoundToggle = (sound: AmbientSound) => {
    setError(null);

    // Check if sound is already active
    const existingSound = activeSounds.find((s) => s.id === sound._id);

    if (existingSound) {
      // Toggle play/pause for existing sound
      if (existingSound.isPlaying) {
        // Pause the sound
        try {
          existingSound.audio.pause();
          setActiveSounds((prev) =>
            prev.map((s) =>
              s.id === sound._id ? { ...s, isPlaying: false } : s
            )
          );
        } catch (err) {
          console.error("Error pausing sound:", err);
          setError(`Failed to pause ${sound.name}.`);
        }
      } else {
        // Resume the sound
        try {
          existingSound.audio.play().catch((err) => {
            console.error("Error playing sound:", err);
            setError(`Failed to play ${sound.name}. Please try again.`);
          });
          setActiveSounds((prev) =>
            prev.map((s) =>
              s.id === sound._id ? { ...s, isPlaying: true } : s
            )
          );
        } catch (err) {
          console.error("Error resuming sound:", err);
          setError(`Failed to play ${sound.name}. Please try again.`);
        }
      }
    } else {
      // Create and play a new sound
      try {
        const audio = new Audio();
        audio.src = sound.url;
        audio.loop = true;

        // Create the new active sound object with default volume settings
        const newSound: ActiveSound = {
          id: sound._id,
          name: sound.name,
          url: sound.url,
          audio: audio,
          isPlaying: false, // Start as not playing until confirmed
          volume: 70, // Default individual volume
          isMuted: false,
          showVolumeControl: false,
        };

        // Set initial volume based on master and individual settings
        audio.volume = calculateVolume(newSound.volume, newSound.isMuted);

        // Add error handler
        audio.onerror = () => {
          console.error(`Error loading sound: ${sound.name}`);
          setError(`Failed to load ${sound.name}. Please try another sound.`);
          setActiveSounds((prev) => prev.filter((s) => s.id !== sound._id));
        };

        // Add to active sounds
        setActiveSounds((prev) => [...prev, newSound]);

        // Try to play the sound
        audio
          .play()
          .then(() => {
            setActiveSounds((prev) =>
              prev.map((s) =>
                s.id === sound._id ? { ...s, isPlaying: true } : s
              )
            );
          })
          .catch((err) => {
            console.error("Error playing sound:", err);
            setError(`Failed to play ${sound.name}. Please try again.`);
          });
      } catch (err) {
        console.error("Error creating sound:", err);
        setError(`Failed to create ${sound.name}. Please try again.`);
      }
    }
  };

  const removeSound = (soundId: string) => {
    const soundToRemove = activeSounds.find((s) => s.id === soundId);
    if (soundToRemove) {
      try {
        soundToRemove.audio.pause();
        soundToRemove.audio.src = "";
      } catch (err) {
        console.error("Error removing sound:", err);
      }
      setActiveSounds((prev) => prev.filter((s) => s.id !== soundId));
    }
  };

  const toggleMasterMute = () => {
    if (isMasterMuted) {
      setMasterVolume(previousMasterVolumeRef.current);
      setIsMasterMuted(false);
    } else {
      previousMasterVolumeRef.current = masterVolume;
      setIsMasterMuted(true);
    }
  };

  const toggleSoundMute = (soundId: string) => {
    setActiveSounds((prev) =>
      prev.map((sound) => {
        if (sound.id === soundId) {
          const newMuteState = !sound.isMuted;
          try {
            sound.audio.volume = newMuteState
              ? 0
              : calculateVolume(sound.volume, false);
          } catch (err) {
            console.error("Error toggling mute:", err);
          }
          return { ...sound, isMuted: newMuteState };
        }
        return sound;
      })
    );
  };

  const updateSoundVolume = (soundId: string, newVolume: number) => {
    setActiveSounds((prev) =>
      prev.map((sound) => {
        if (sound.id === soundId) {
          try {
            sound.audio.volume = calculateVolume(newVolume, sound.isMuted);
          } catch (err) {
            console.error("Error updating sound volume:", err);
          }
          return { ...sound, volume: newVolume };
        }
        return sound;
      })
    );
  };

  const toggleVolumeControl = (soundId: string) => {
    setActiveSounds((prev) =>
      prev.map((sound) =>
        sound.id === soundId
          ? { ...sound, showVolumeControl: !sound.showVolumeControl }
          : sound
      )
    );
  };

  const handleClose = () => {
    // Stop all sounds
    activeSounds.forEach((sound) => {
      try {
        sound.audio.pause();
        sound.audio.src = "";
      } catch (err) {
        console.error("Error stopping sound:", err);
      }
    });
    setActiveSounds([]);
    onClose();
  };

  const isSoundActive = (soundId: string) => {
    return activeSounds.some((s) => s.id === soundId);
  };

  const isSoundPlaying = (soundId: string) => {
    const sound = activeSounds.find((s) => s.id === soundId);
    return sound ? sound.isPlaying : false;
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="body">
      <div
        ref={nodeRef}
        className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-[#121212] rounded-xl shadow-2xl border border-gray-700 w-80 text-white z-[1000] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-500 to-red-700 p-3 flex justify-between items-center drag-handle cursor-move">
          <div className="flex items-center">
            <GripVertical className="w-5 h-5 mr-2 text-white/70" />
            <h2 className="text-lg font-semibold">Ambient Sounds</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-black/20 transition-all duration-200"
            aria-label="Close ambient sounds"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {error && (
          <div className="m-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : sounds.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            No ambient sounds available.
          </div>
        ) : (
          <div className="p-3 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {sounds.map((sound) => (
                <button
                  key={sound._id}
                  onClick={() => handleSoundToggle(sound)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    isSoundActive(sound._id)
                      ? isSoundPlaying(sound._id)
                        ? "bg-red-500/20 border border-red-500/30 text-white"
                        : "bg-gray-800 border border-gray-700 text-gray-300"
                      : "bg-black/30 border border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                  aria-label={`${
                    isSoundPlaying(sound._id) ? "Pause" : "Play"
                  } ${sound.name} ambient sound`}
                >
                  <span className="font-medium">{sound.name}</span>
                  <span>
                    {isSoundActive(sound._id) ? (
                      isSoundPlaying(sound._id) ? (
                        <Pause className="w-4 h-4 text-red-400" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSounds.length > 0 && (
          <div className="border-t border-gray-700 p-3">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Active Sounds
              </h3>
              <div className="space-y-2">
                {activeSounds.map((sound) => (
                  <div
                    key={sound.id}
                    className="bg-black/30 rounded-lg border border-gray-700 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-2">
                      <span className="text-sm text-gray-300">
                        {sound.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVolumeControl(sound.id)}
                          className="p-1 rounded-full hover:bg-gray-700 transition-all duration-200"
                          aria-label="Toggle volume control"
                        >
                          {sound.showVolumeControl ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleSoundMute(sound.id)}
                          className="p-1 rounded-full hover:bg-gray-700 transition-all duration-200"
                          aria-label={sound.isMuted ? "Unmute" : "Mute"}
                        >
                          {sound.isMuted ? (
                            <VolumeX className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleSoundToggle(
                              sounds.find(
                                (s) => s._id === sound.id
                              ) as AmbientSound
                            )
                          }
                          className="p-1 rounded-full hover:bg-gray-700 transition-all duration-200"
                        >
                          {sound.isPlaying ? (
                            <Pause className="w-4 h-4 text-red-400" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => removeSound(sound.id)}
                          className="p-1 rounded-full hover:bg-gray-700 transition-all duration-200"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {sound.showVolumeControl && (
                      <div className="px-2 pb-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Volume</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sound.isMuted ? 0 : sound.volume}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value);
                              if (value > 0 && sound.isMuted) {
                                // Unmute if volume is increased from zero
                                setActiveSounds((prev) =>
                                  prev.map((s) =>
                                    s.id === sound.id
                                      ? { ...s, isMuted: false }
                                      : s
                                  )
                                );
                              }
                              updateSoundVolume(sound.id, value);
                            }}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                          />
                          <span className="text-xs text-gray-400 w-6 text-right">
                            {sound.isMuted ? 0 : sound.volume}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  Master Volume
                </span>
                <button
                  onClick={toggleMasterMute}
                  className="p-1 rounded-full hover:bg-gray-700 transition-all duration-200"
                  aria-label={isMasterMuted ? "Unmute" : "Mute"}
                >
                  {isMasterMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-red-400" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMasterMuted ? 0 : masterVolume}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value);
                    if (value > 0 && isMasterMuted) {
                      setIsMasterMuted(false);
                    }
                    setMasterVolume(value);
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <span className="text-xs text-gray-400 w-8 text-right">
                  {isMasterMuted ? 0 : masterVolume}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default AmbientSounds;
