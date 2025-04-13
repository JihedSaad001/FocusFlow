"use client";

import { useEffect, useState, useRef } from "react";
import {
  uploadFile,
  uploadAudio,
  fetchResources,
  fetchAudioResources,
  deleteResource,
} from "../api";
import {
  FaUpload,
  FaTrash,
  FaDownload,
  FaMusic,
  FaImage,
} from "react-icons/fa";

const ResourcesDatabase = () => {
  const [activeTab, setActiveTab] = useState("wallpapers");
  const [files, setFiles] = useState<any[]>([]); // Wallpapers
  const [audioFiles, setAudioFiles] = useState<any[]>([]); // Ambient sounds
  const [musicFiles, setMusicFiles] = useState<any[]>([]); // Music tracks
  const [file, setFile] = useState<File | null>(null); // Wallpaper file
  const [audioFile, setAudioFile] = useState<File | null>(null); // Ambient sound file
  const [musicFile, setMusicFile] = useState<File | null>(null); // Music file
  const [audioName, setAudioName] = useState(""); // Ambient sound name
  const [musicName, setMusicName] = useState(""); // Music name
  const [category, setCategory] = useState("abstract"); // Wallpaper category
  const [tags, setTags] = useState(""); // Tags for all resource types
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Wallpaper input ref
  const audioInputRef = useRef<HTMLInputElement>(null); // Ambient sound input ref
  const musicInputRef = useRef<HTMLInputElement>(null); // Music input ref
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    loadResources();
  }, [activeTab]);

  const loadResources = async () => {
    setLoading(true);
    try {
      if (activeTab === "wallpapers") {
        const data = await fetchResources();
        setFiles(data);
      } else if (activeTab === "audio") {
        const data = await fetchAudioResources();
        setAudioFiles(data);
      } else if (activeTab === "music") {
        const response = await fetch(
          "focusflow-production.up.railway.app/api/resources/music"
        );
        if (!response.ok) throw new Error("Failed to fetch music tracks");
        const data = await response.json();
        setMusicFiles(data);
      }
    } catch (error) {
      console.error("Failed to load resources", error);
      setMessage({ text: "Failed to load resources", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: "No file selected!", type: "error" });
      return;
    }
    console.log(
      "📂 Uploading file:",
      file.name,
      "Category:",
      category,
      "Tags:",
      tags
    );

    setLoading(true);
    setMessage(null);
    try {
      await uploadFile(file, category, tags, token);
      console.log("✅ Upload Successful!");
      setMessage({ text: "Wallpaper uploaded successfully!", type: "success" });
      loadResources();
      setFile(null);
      setTags("");
      setCategory("abstract");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("🔥 Upload failed", error);
      setMessage({ text: `Upload failed: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async () => {
    if (!audioFile) {
      setMessage({ text: "No audio file selected!", type: "error" });
      return;
    }
    if (!audioName.trim()) {
      setMessage({
        text: "Please provide a name for the audio",
        type: "error",
      });
      return;
    }

    console.log(
      "🎵 Uploading audio:",
      audioFile.name,
      "Name:",
      audioName,
      "Tags:",
      tags
    );

    setLoading(true);
    setMessage(null);
    try {
      await uploadAudio(audioFile, audioName, tags, token);
      console.log("✅ Audio Upload Successful!");
      setMessage({ text: "Audio uploaded successfully!", type: "success" });
      loadResources();
      setAudioFile(null);
      setAudioName("");
      setTags("");
      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("🔥 Audio upload failed", error);
      setMessage({ text: `Upload failed: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMusicUpload = async () => {
    if (!musicFile) {
      setMessage({ text: "No music file selected!", type: "error" });
      return;
    }
    if (!musicName.trim()) {
      setMessage({
        text: "Please provide a name for the music",
        type: "error",
      });
      return;
    }

    console.log(
      "🎶 Uploading music:",
      musicFile.name,
      "Name:",
      musicName,
      "Tags:",
      tags
    );

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", musicFile);
      formData.append("name", musicName);
      if (tags) formData.append("tags", tags);

      const response = await fetch(
        "focusflow-production.up.railway.app/api/resources/upload-music",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload music");
      }

      console.log("✅ Music Upload Successful!");
      setMessage({ text: "Music uploaded successfully!", type: "success" });
      loadResources();
      setMusicFile(null);
      setMusicName("");
      setTags("");
      if (musicInputRef.current) {
        musicInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("🔥 Music upload failed", error);
      setMessage({ text: `Upload failed: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    try {
      await deleteResource(id, token);
      setMessage({ text: "Resource deleted successfully!", type: "success" });
      loadResources();
    } catch (error: any) {
      console.error("Delete failed", error);
      setMessage({ text: `Delete failed: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearch("");
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 mt-20 md:px-12 lg:px-20 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Resources Database</h1>

        {/* Custom tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => handleTabChange("wallpapers")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "wallpapers"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FaImage /> Wallpapers
            </button>
            <button
              onClick={() => handleTabChange("audio")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "audio"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FaMusic /> Ambient Sounds
            </button>
            <button
              onClick={() => handleTabChange("music")}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeTab === "music"
                  ? "border-b-2 border-red-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FaMusic /> Music
            </button>
          </div>
        </div>

        {/* Wallpapers Tab Content */}
        {activeTab === "wallpapers" && (
          <div className="bg-[#151515] p-6 rounded-lg shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Upload a Wallpaper</h2>
            {message && (
              <p
                className={`mb-4 p-2 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              accept="image/*"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            >
              <option value="nature">Nature</option>
              <option value="abstract">Abstract</option>
              <option value="dark">Dark</option>
              <option value="minimal">Minimal</option>
            </select>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated, e.g., scenic,blue)"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`bg-red-500 px-6 py-2 rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaUpload /> {loading ? "Uploading..." : "Upload"}
            </button>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Available Wallpapers
            </h2>
            <input
              type="text"
              placeholder="Search wallpapers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-120 mb-4 p-2 border border-gray-600 rounded-lg bg-black"
            />

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files
                  .filter((file) =>
                    file.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((file) => (
                    <div
                      key={file._id}
                      className="bg-[#151515] p-4 rounded-lg shadow-lg border border-white/20 flex justify-between items-center"
                    >
                      <div>
                        <p>{file.name}</p>
                        <p className="text-gray-400 text-sm">
                          Category: {file.category}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Tags: {file.tags.join(", ")}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={file.url}
                          download
                          className="bg-green-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                        >
                          <FaDownload />
                        </a>
                        {token && (
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="bg-red-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Audio Tab Content */}
        {activeTab === "audio" && (
          <div className="bg-[#151515] p-6 rounded-lg shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">
              Upload an Ambient Sound
            </h2>
            {message && (
              <p
                className={`mb-4 p-2 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
            <input
              type="file"
              ref={audioInputRef}
              onChange={(e) =>
                setAudioFile(e.target.files ? e.target.files[0] : null)
              }
              accept="audio/mp3,audio/wav,audio/ogg"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <input
              type="text"
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              placeholder="Sound Name (e.g., Rainforest Ambience)"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated, e.g., nature,rain)"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <button
              onClick={handleAudioUpload}
              disabled={loading}
              className={`bg-red-500 px-6 py-2 rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaUpload /> {loading ? "Uploading..." : "Upload"}
            </button>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Available Ambient Sounds
            </h2>
            <input
              type="text"
              placeholder="Search sounds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-120 mb-4 p-2 border border-gray-600 rounded-lg bg-black"
            />

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {audioFiles
                  .filter((file) =>
                    file.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((file) => (
                    <div
                      key={file._id}
                      className="bg-[#151515] p-4 rounded-lg shadow-lg border border-white/20 flex justify-between items-center"
                    >
                      <div>
                        <p>{file.name}</p>
                        <p className="text-gray-400 text-sm">
                          Format: {file.format}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Tags: {file.tags.join(", ")}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={file.url}
                          download
                          className="bg-green-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                        >
                          <FaDownload />
                        </a>
                        {token && (
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="bg-red-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Music Tab Content */}
        {activeTab === "music" && (
          <div className="bg-[#151515] p-6 rounded-lg shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Upload a Music Track</h2>
            {message && (
              <p
                className={`mb-4 p-2 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
            <input
              type="file"
              ref={musicInputRef}
              onChange={(e) =>
                setMusicFile(e.target.files ? e.target.files[0] : null)
              }
              accept="audio/mp3,audio/wav,audio/ogg"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <input
              type="text"
              value={musicName}
              onChange={(e) => setMusicName(e.target.value)}
              placeholder="Music Name (e.g., Chill Lo-Fi)"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated, e.g., chill,lofi)"
              className="block w-80 mb-3 p-2 border border-gray-600 rounded-lg bg-black"
            />
            <button
              onClick={handleMusicUpload}
              disabled={loading}
              className={`bg-red-500 px-6 py-2 rounded-lg shadow-lg hover:opacity-90 flex items-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaUpload /> {loading ? "Uploading..." : "Upload"}
            </button>

            <h2 className="text-xl font-semibold mt-8 mb-4">
              Available Music Tracks
            </h2>
            <input
              type="text"
              placeholder="Search music..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-120 mb-4 p-2 border border-gray-600 rounded-lg bg-black"
            />

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {musicFiles
                  .filter((file) =>
                    file.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((file) => (
                    <div
                      key={file._id}
                      className="bg-[#151515] p-4 rounded-lg shadow-lg border border-white/20 flex justify-between items-center"
                    >
                      <div>
                        <p>{file.name}</p>
                        <p className="text-gray-400 text-sm">
                          Format: {file.format}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Tags: {file.tags.join(", ")}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={file.url}
                          download
                          className="bg-green-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                        >
                          <FaDownload />
                        </a>
                        {token && (
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="bg-red-500 p-2 rounded-lg shadow-lg hover:opacity-90"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesDatabase;
