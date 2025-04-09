"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
  Music,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Draggable from "react-draggable";
import { logFocusSession } from "../../../Api";

// Global audio management for music
const globalMusicInstances: { [key: string]: HTMLAudioElement } = {};
let globalMusicSessionStartTime: Date | null = null;

// Setup global handler for music state
const setupMusicStateHandler = () => {
  const syncMusicState = () => {
    try {
      const storedMusic = localStorage.getItem("activeMusicTracks");
      if (!storedMusic) return;

      const tracks = JSON.parse(storedMusic);
      const updatedTracks = tracks.map((track: any) => {
        const audio = globalMusicInstances[track.id];
        const isActuallyPlaying = audio ? !audio.paused : false;

        return {
          ...track,
          isPlaying: isActuallyPlaying,
        };
      });

      localStorage.setItem("activeMusicTracks", JSON.stringify(updatedTracks));

      const activeTrackNames = Object.entries(globalMusicInstances)
        .filter(([_, audio]) => !audio.paused)
        .map(([id]) => {
          const track = updatedTracks.find((s: any) => s.id === id);
          return track ? track.name : "Unknown";
        })
        .join(", ");

      if (activeTrackNames) {
        localStorage.setItem("activeMusicTrack", activeTrackNames);
      } else {
        localStorage.removeItem("activeMusicTrack");
      }

      if (
        Object.values(globalMusicInstances).some((audio) => !audio.paused) &&
        !globalMusicSessionStartTime
      ) {
        globalMusicSessionStartTime = new Date();
      } else if (
        !Object.values(globalMusicInstances).some((audio) => !audio.paused) &&
        globalMusicSessionStartTime
      ) {
        const token = localStorage.getItem("token");
        if (token) {
          const now = new Date();
          const sessionDuration = Math.floor(
            (now.getTime() - globalMusicSessionStartTime.getTime()) / 60000
          );

          if (sessionDuration >= 1) {
            logFocusSession(token, {
              duration: sessionDuration,
              completed: true,
              ambientSound: activeTrackNames,
            }).catch((err) =>
              console.error("Error logging focus session:", err)
            );
          }
        }
        globalMusicSessionStartTime = null;
      }
    } catch (error) {
      console.error("Error in music state handler:", error);
    }
  };

  setInterval(syncMusicState, 5000);
};

if (typeof window !== "undefined") {
  setupMusicStateHandler();
}

type MusicTrack = {
  _id: string;
  name: string;
  url: string;
  tags: string[];
};

type ActiveTrack = {
  id: string;
  name: string;
  url: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  showVolumeControl: boolean;
};

const MusicPlayer = ({ onClose }: { onClose: () => void }) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeTracks, setActiveTracks] = useState<ActiveTrack[]>([]);
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousMasterVolumeRef = useRef(masterVolume);
  const nodeRef = useRef(null);

  useEffect(() => {
    console.log("MusicPlayer component mounted");

    const storedMasterVolume = localStorage.getItem("musicMasterVolume");
    const storedMasterMuted = localStorage.getItem("musicMasterMuted");

    if (storedMasterVolume) {
      setMasterVolume(Number(storedMasterVolume));
    }

    if (storedMasterMuted) {
      setIsMasterMuted(storedMasterMuted === "true");
    }

    syncWithAudioState();
    fetchMusicTracks();
  }, []);

  const syncWithAudioState = () => {
    const storedTracks = localStorage.getItem("activeMusicTracks");

    if (storedTracks) {
      try {
        const parsedTracks: ActiveTrack[] = JSON.parse(storedTracks);
        const restoredTracks = parsedTracks.map((track) => {
          const audio = globalMusicInstances[track.id];
          const isActuallyPlaying = audio ? !audio.paused : false;

          return {
            ...track,
            isPlaying: isActuallyPlaying,
            showVolumeControl: false,
          };
        });

        setActiveTracks(restoredTracks);
      } catch (error) {
        console.error("Error parsing stored tracks:", error);
      }
    }
  };

  useEffect(() => {
    setActiveTracks((prevTracks) =>
      prevTracks.map((track) => {
        const audio = globalMusicInstances[track.id];
        const isActuallyPlaying = audio ? !audio.paused : false;

        return {
          ...track,
          isPlaying: isActuallyPlaying,
        };
      })
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("musicMasterVolume", masterVolume.toString());
    localStorage.setItem("musicMasterMuted", isMasterMuted.toString());

    const tracksToStore = activeTracks.map((track) => {
      const audio = globalMusicInstances[track.id];
      const isActuallyPlaying = audio ? !audio.paused : false;

      return {
        ...track,
        isPlaying: isActuallyPlaying,
      };
    });

    localStorage.setItem("activeMusicTracks", JSON.stringify(tracksToStore));

    const activeTrackNames = activeTracks
      .filter(
        (s) => globalMusicInstances[s.id] && !globalMusicInstances[s.id].paused
      )
      .map((s) => s.name)
      .join(", ");
    if (activeTrackNames) {
      localStorage.setItem("activeMusicTrack", activeTrackNames);
    } else {
      localStorage.removeItem("activeMusicTrack");
    }
  }, [activeTracks, masterVolume, isMasterMuted]);

  useEffect(() => {
    activeTracks.forEach((track) => {
      const audio = globalMusicInstances[track.id];
      if (audio) {
        audio.volume = calculateVolume(track.volume, track.isMuted);
      }
    });
  }, [masterVolume, isMasterMuted, activeTracks]);

  const fetchMusicTracks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://focusflow-production.up.railway.app/api/resources/music"
      );
      if (!response.ok) throw new Error("Failed to fetch music tracks");
      const data = await response.json();
      setTracks(data);
    } catch (err) {
      console.error("Error fetching music tracks:", err);
      setError("Failed to load music tracks. Using default tracks instead.");
      setTracks(getDefaultTracks());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultTracks = (): MusicTrack[] => [
    {
      _id: "default-1",
      name: "Lo-Fi Chill",
      url: "https://cdn.freesound.org/previews/18/18765_18799-lq.mp3",
      tags: ["lofi", "chill"],
    },
    {
      _id: "default-2",
      name: "Jazz Piano",
      url: "https://cdn.freesound.org/previews/47/47539_35187-lq.mp3",
      tags: ["jazz", "piano"],
    },
    {
      _id: "default-3",
      name: "Ambient Synth",
      url: "https://cdn.freesound.org/previews/2/2523_4205-lq.mp3",
      tags: ["ambient", "synth"],
    },
  ];

  const calculateVolume = (trackVolume: number, isTrackMuted: boolean) => {
    if (isMasterMuted || isTrackMuted) return 0;
    return (trackVolume / 100) * (masterVolume / 100);
  };

  // Add helper function to stop other playing tracks
  const stopOtherTracks = (currentTrackId: string) => {
    setActiveTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== currentTrackId && track.isPlaying) {
          const audio = globalMusicInstances[track.id];
          if (audio && !audio.paused) {
            audio.pause();
          }
          return { ...track, isPlaying: false };
        }
        return track;
      })
    );
  };

  const handleTrackToggle = (track: MusicTrack) => {
    setError(null);
    const existingTrack = activeTracks.find((s) => s.id === track._id);

    if (existingTrack) {
      const audio = globalMusicInstances[track._id];
      if (audio.paused) {
        // Stop other tracks before playing this one
        stopOtherTracks(track._id);
        try {
          audio.play().catch((err) => {
            console.error("Error playing track:", err);
            setError(`Failed to play ${track.name}. Please try again.`);
          });
          setActiveTracks((prev) =>
            prev.map((s) =>
              s.id === track._id ? { ...s, isPlaying: true } : s
            )
          );
        } catch (err) {
          console.error("Error resuming track:", err);
          setError(`Failed to play ${track.name}. Please try again.`);
        }
      } else {
        try {
          audio.pause();
          setActiveTracks((prev) =>
            prev.map((s) =>
              s.id === track._id ? { ...s, isPlaying: false } : s
            )
          );
        } catch (err) {
          console.error("Error pausing track:", err);
          setError(`Failed to pause ${track.name}.`);
        }
      }
    } else {
      // Stop other tracks before adding a new one
      stopOtherTracks(track._id);
      try {
        const audio = new Audio(track.url);
        audio.loop = true;
        const newTrack: ActiveTrack = {
          id: track._id,
          name: track.name,
          url: track.url,
          isPlaying: false,
          volume: 70,
          isMuted: false,
          showVolumeControl: false,
        };
        audio.volume = calculateVolume(newTrack.volume, newTrack.isMuted);
        globalMusicInstances[track._id] = audio;

        audio.onerror = () => {
          console.error(`Error loading track: ${track.name}`);
          setError(`Failed to load ${track.name}. Please try another track.`);
          setActiveTracks((prev) => prev.filter((s) => s.id !== track._id));
          delete globalMusicInstances[track._id];
        };

        setActiveTracks((prev) => [...prev, newTrack]);
        audio
          .play()
          .then(() => {
            setActiveTracks((prev) =>
              prev.map((s) =>
                s.id === track._id ? { ...s, isPlaying: true } : s
              )
            );
          })
          .catch((err) => {
            console.error("Error playing track:", err);
            setError(`Failed to play ${track.name}. Please try again.`);
          });
      } catch (err) {
        console.error("Error creating track:", err);
        setError(`Failed to create ${track.name}. Please try again.`);
      }
    }
  };

  const removeTrack = (trackId: string) => {
    const audio = globalMusicInstances[trackId];
    if (audio) {
      try {
        audio.pause();
        audio.src = "";
        delete globalMusicInstances[trackId];
      } catch (err) {
        console.error("Error removing track:", err);
      }
    }
    setActiveTracks((prev) => prev.filter((s) => s.id !== trackId));
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

  const toggleTrackMute = (trackId: string) => {
    setActiveTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          const newMuteState = !track.isMuted;
          const audio = globalMusicInstances[trackId];
          if (audio) {
            audio.volume = calculateVolume(track.volume, newMuteState);
          }
          return { ...track, isMuted: newMuteState };
        }
        return track;
      })
    );
  };

  const updateTrackVolume = (trackId: string, newVolume: number) => {
    setActiveTracks((prev) =>
      prev.map((track) => {
        if (track.id === trackId) {
          const audio = globalMusicInstances[trackId];
          if (audio) {
            audio.volume = calculateVolume(newVolume, track.isMuted);
          }
          return { ...track, volume: newVolume };
        }
        return track;
      })
    );
  };

  const toggleVolumeControl = (trackId: string) => {
    setActiveTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? { ...track, showVolumeControl: !track.showVolumeControl }
          : track
      )
    );
  };

  const handleClose = () => {
    onClose();
  };

  const isTrackActive = (trackId: string) => {
    return activeTracks.some((s) => s.id === trackId);
  };

  const isTrackPlaying = (trackId: string) => {
    const audio = globalMusicInstances[trackId];
    return audio ? !audio.paused : false;
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="body">
      <div
        ref={nodeRef}
        className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-[#1E1E1E] rounded-2xl shadow-2xl border-1 border-[#ff4e50] w-96 text-white z-[1000] overflow-hidden"
      >
        <div className="bg-[#1E1E1E] p-4 flex justify-between items-center drag-handle cursor-move">
          <div className="flex items-center">
            <Music className="w-6 h-6 mr-3 text-white" />
            <h2 className="text-xl font-bold">Vibe Player</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-black/20 transition-all duration-200"
            aria-label="Close music player"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No tracks available. Add some music to vibe to!
          </div>
        ) : (
          <div className="p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-gray-800">
            <div className="space-y-3">
              {tracks.map((track) => (
                <button
                  key={track._id}
                  onClick={() => handleTrackToggle(track)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border border-gray-700/50 transition-all duration-300 ${
                    isTrackActive(track._id)
                      ? isTrackPlaying(track._id)
                        ? "bg-gradient-to-r from-red-500/20 to-red-700/20 border-red-500/50 text-white shadow-md"
                        : "bg-gray-800/50 border-gray-600 text-gray-300"
                      : "bg-black/30 border-gray-700 text-gray-300 hover:bg-gray-800/70 hover:border-red-500/30"
                  }`}
                  aria-label={`${
                    isTrackPlaying(track._id) ? "Pause" : "Play"
                  } ${track.name} music track`}
                >
                  <span className="font-medium truncate max-w-[200px]">
                    {track.name}
                  </span>
                  <span>
                    {isTrackActive(track._id) ? (
                      isTrackPlaying(track._id) ? (
                        <Pause className="w-5 h-5 text-red-400" />
                      ) : (
                        <Play className="w-5 h-5 text-gray-400" />
                      )
                    ) : (
                      <Play className="w-5 h-5 text-gray-400" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTracks.length > 0 && (
          <div className="border-t border-red-500/20 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">
                Now Playing
              </h3>
              <div className="space-y-3">
                {activeTracks.map((track) => (
                  <div
                    key={track.id}
                    className="bg-black/40 rounded-lg border border-red-500/20 p-3 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium truncate max-w-[180px]">
                        {track.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVolumeControl(track.id)}
                          className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-200"
                          aria-label="Toggle volume control"
                        >
                          {track.showVolumeControl ? (
                            <ChevronUp className="w-4 h-4 text-red-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleTrackMute(track.id)}
                          className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-200"
                          aria-label={track.isMuted ? "Unmute" : "Mute"}
                        >
                          {track.isMuted ? (
                            <VolumeX className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleTrackToggle(
                              tracks.find(
                                (s) => s._id === track.id
                              ) as MusicTrack
                            )
                          }
                          className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-200"
                          aria-label={
                            isTrackPlaying(track.id) ? "Pause" : "Play"
                          }
                        >
                          {isTrackPlaying(track.id) ? (
                            <Pause className="w-4 h-4 text-red-400" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => removeTrack(track.id)}
                          className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-200"
                          aria-label="Remove track"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {track.showVolumeControl && (
                      <div className="mt-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">Volume</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={track.isMuted ? 0 : track.volume}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value);
                              if (value > 0 && track.isMuted) {
                                setActiveTracks((prev) =>
                                  prev.map((s) =>
                                    s.id === track.id
                                      ? { ...s, isMuted: false }
                                      : s
                                  )
                                );
                              }
                              updateTrackVolume(track.id, value);
                            }}
                            className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500 transition-all duration-200"
                          />
                          <span className="text-xs text-gray-400 w-8 text-right">
                            {track.isMuted ? 0 : track.volume}%
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
                <span className="text-sm font-semibold text-gray-300">
                  Master Volume
                </span>
                <button
                  onClick={toggleMasterMute}
                  className="p-1 rounded-full hover:bg-red-500/20 transition-all duration-200"
                  aria-label={isMasterMuted ? "Unmute" : "Mute"}
                >
                  {isMasterMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-red-400" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3">
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
                  className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500 transition-all duration-200"
                />
                <span className="text-xs text-gray-400 w-10 text-right">
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

export default MusicPlayer;
