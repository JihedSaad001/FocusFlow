import { useEffect, useState, useRef } from "react";
import { uploadFile, fetchResources, deleteResource } from "../api";
import { FaUpload, FaTrash, FaDownload } from "react-icons/fa";

const ResourcesDatabase = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("abstract"); // Default to a valid category
  const [tags, setTags] = useState(""); // New state for tags
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null); // For success/error messages
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to reset file input
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchResources();
      setFiles(data);
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
      // Reset form
      setFile(null);
      setTags("");
      setCategory("abstract");
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    } catch (error: any) {
      console.error("🔥 Upload failed", error);
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

  return (
    <div className="min-h-screen bg-[#121212] text-white px-6 mt-20 md:px-12 lg:px-20 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Resources Database</h1>
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
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            accept="image/*" // Restrict to image files
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
                    key={file._id} // Use _id from MongoDB
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
      </div>
    </div>
  );
};

export default ResourcesDatabase;
